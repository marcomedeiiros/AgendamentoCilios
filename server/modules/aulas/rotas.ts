import { Router } from "express";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "../shared/prisma";
import { exigirAdmin, exigirLogin } from "../identity/sessao";

export const rotasAulas = Router();

export const dirVideos = path.resolve(process.cwd(), "server/data/videos");

const TIPOS_VIDEO: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/**
 * Entrega o vídeo da aula.
 *
 * O arquivo fica fora de qualquer pasta estática: o caminho real nunca chega
 * ao navegador. Cada requisição confere matrícula sem isso bastaria a URL
 * vazar para o curso virar público.
 *
 * Responde a Range porque o player precisa disso para avançar no vídeo; sem
 * suporte, o navegador baixa o arquivo inteiro antes de qualquer seek.
 */
rotasAulas.get("/:id/video", async (req, res) => {
  const aula = await prisma.lesson.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, videoPath: true, videoMimeType: true, gratuita: true, courseId: true },
  });

  if (!aula?.videoPath) {
    res.status(404).json({ erros: ["Aula sem vídeo."] });
    return;
  }

  if (!aula.gratuita) {
    if (!req.usuario) {
      res.status(401).json({ erros: ["Entre na sua conta para assistir."] });
      return;
    }

    const matricula = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.usuario.id, courseId: aula.courseId } },
      select: { id: true },
    });

    if (!matricula && req.usuario.role !== "admin") {
      res.status(403).json({ erros: ["Este curso ainda não está liberado para você."] });
      return;
    }
  }

  // basename evita que um videoPath manipulado escape da pasta de vídeos.
  const arquivo = path.join(dirVideos, path.basename(aula.videoPath));

  let tamanho: number;
  try {
    tamanho = (await fs.stat(arquivo)).size;
  } catch {
    res.status(404).json({ erros: ["Arquivo do vídeo não encontrado."] });
    return;
  }

  const tipo = aula.videoMimeType ?? "video/mp4";
  const range = req.headers.range;

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", tipo);
  // Conteúdo pago: nada de cache compartilhado.
  res.setHeader("Cache-Control", "private, max-age=0, no-store");

  if (!range) {
    res.setHeader("Content-Length", tamanho);
    createReadStream(arquivo).pipe(res);
    return;
  }

  const partes = /bytes=(\d*)-(\d*)/.exec(range);
  if (!partes) {
    res.status(416).setHeader("Content-Range", `bytes */${tamanho}`).end();
    return;
  }

  const inicio = partes[1] ? Number(partes[1]) : 0;
  const fim = partes[2] ? Math.min(Number(partes[2]), tamanho - 1) : tamanho - 1;

  if (Number.isNaN(inicio) || Number.isNaN(fim) || inicio > fim || inicio >= tamanho) {
    res.status(416).setHeader("Content-Range", `bytes */${tamanho}`).end();
    return;
  }

  res.status(206);
  res.setHeader("Content-Range", `bytes ${inicio}-${fim}/${tamanho}`);
  res.setHeader("Content-Length", fim - inicio + 1);
  createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
});

/**
 * Envio do vídeo de uma aula (só admin).
 *
 * O corpo da requisição é o arquivo puro, em stream direto para o disco 
 * nada de multipart em memória, que estouraria com vídeo de aula. Exemplo:
 *
 *   curl -X PUT --data-binary @aula1.mp4 \
 *        -H "Content-Type: video/mp4" \
 *        -b cookies.txt \
 *        http://localhost:3000/api/aulas/<id>/video
 */
rotasAulas.put("/:id/video", exigirLogin, exigirAdmin, async (req, res) => {
  const aula = await prisma.lesson.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, videoPath: true },
  });

  if (!aula) {
    res.status(404).json({ erros: ["Aula não encontrada."] });
    return;
  }

  const tipo = (req.header("content-type") ?? "").split(";")[0].trim();
  const extensao = TIPOS_VIDEO[tipo];
  if (!extensao) {
    res.status(415).json({ erros: ["Envie o vídeo em MP4, WebM ou MOV."] });
    return;
  }

  await fs.mkdir(dirVideos, { recursive: true });
  const nome = `${randomUUID()}${extensao}`;
  const destino = path.join(dirVideos, nome);

  try {
    const { createWriteStream } = await import("node:fs");
    const { pipeline } = await import("node:stream/promises");
    await pipeline(req, createWriteStream(destino));
  } catch (erro) {
    await fs.rm(destino, { force: true });
    console.error("Falha ao gravar vídeo da aula:", erro);
    res.status(500).json({ erros: ["Não foi possível salvar o vídeo."] });
    return;
  }

  const { size } = await fs.stat(destino);
  const anterior = aula.videoPath;

  await prisma.lesson.update({
    where: { id: aula.id },
    data: { videoPath: nome, videoMimeType: tipo, videoBytes: size },
  });

  // Só apaga o antigo depois que o novo está gravado e registrado.
  if (anterior) {
    await fs.rm(path.join(dirVideos, path.basename(anterior)), { force: true });
  }

  res.json({ ok: true, bytes: size });
});

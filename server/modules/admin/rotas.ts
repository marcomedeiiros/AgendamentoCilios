import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "../shared/prisma";
import { exigirAdmin, exigirLogin } from "../identity/sessao";
import {
  aprovar,
  excluir,
  gravarFoto,
  listarTodos,
} from "../depoimentos/armazenamento";
import { dirVideos } from "../aulas/rotas";

export const rotasAdmin = Router();

// Tudo aqui exige sessão de admin.
rotasAdmin.use(exigirLogin, exigirAdmin);

function texto(valor: unknown, padrao = ""): string {
  return typeof valor === "string" ? valor.trim() : padrao;
}

function inteiro(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isInteger(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Imagens (capa de curso, foto de serviço, fotos do site)
// ---------------------------------------------------------------------------

rotasAdmin.post("/imagens", async (req, res) => {
  try {
    const caminho = await gravarFoto(texto(req.body?.imagem) || undefined);
    if (!caminho) {
      res.status(400).json({ erros: ["Envie uma imagem."] });
      return;
    }
    res.status(201).json({ url: caminho });
  } catch (erro) {
    res.status(400).json({ erros: [(erro as Error).message] });
  }
});

// ---------------------------------------------------------------------------
// Depoimentos
// ---------------------------------------------------------------------------

rotasAdmin.get("/depoimentos", async (_req, res) => {
  res.json(await listarTodos());
});

rotasAdmin.patch("/depoimentos/:id", async (req, res) => {
  const ok = await aprovar(String(req.params.id), req.body?.aprovado !== false);
  if (!ok) {
    res.status(404).json({ erros: ["Depoimento não encontrado."] });
    return;
  }
  res.json({ ok: true });
});

rotasAdmin.delete("/depoimentos/:id", async (req, res) => {
  const ok = await excluir(String(req.params.id));
  if (!ok) {
    res.status(404).json({ erros: ["Depoimento não encontrado."] });
    return;
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Conteúdo do site
// ---------------------------------------------------------------------------

rotasAdmin.put("/conteudo/:chave", async (req, res) => {
  const chave = String(req.params.chave);
  const valor = req.body?.valor;

  if (valor === undefined || valor === null || typeof valor !== "object") {
    res.status(400).json({ erros: ["Envie o bloco em `valor`."] });
    return;
  }

  await prisma.siteContent.upsert({
    where: { key: chave },
    create: { key: chave, value: valor },
    update: { value: valor },
  });

  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Serviços
// ---------------------------------------------------------------------------

rotasAdmin.get("/servicos", async (_req, res) => {
  res.json(
    await prisma.service.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
  );
});

function dadosServico(corpo: Record<string, unknown>) {
  const erros: string[] = [];
  const name = texto(corpo.name);
  const slug = texto(corpo.slug) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const priceCents = inteiro(corpo.priceCents);
  const durationMinutes = inteiro(corpo.durationMinutes);

  if (name.length < 2) erros.push("Informe o nome do serviço.");
  if (priceCents === null || priceCents < 0) erros.push("Preço inválido.");
  if (durationMinutes === null || durationMinutes <= 0) erros.push("Duração inválida.");

  return {
    erros,
    dados: {
      slug,
      name,
      description: texto(corpo.description) || null,
      priceCents: priceCents ?? 0,
      durationMinutes: durationMinutes ?? 60,
      depositCents: inteiro(corpo.depositCents) ?? 0,
      maintenance: texto(corpo.maintenance) || null,
      imageUrl: texto(corpo.imageUrl) || null,
      position: inteiro(corpo.position) ?? 0,
      active: corpo.active !== false,
    },
  };
}

rotasAdmin.post("/servicos", async (req, res) => {
  const { erros, dados } = dadosServico(req.body ?? {});
  if (erros.length) {
    res.status(400).json({ erros });
    return;
  }
  res.status(201).json(await prisma.service.create({ data: dados }));
});

rotasAdmin.patch("/servicos/:id", async (req, res) => {
  const { erros, dados } = dadosServico(req.body ?? {});
  if (erros.length) {
    res.status(400).json({ erros });
    return;
  }
  res.json(
    await prisma.service.update({ where: { id: String(req.params.id) }, data: dados }),
  );
});

// Serviço não some do banco: ele é referência de agendamento futuro. Some do
// site, que é o que o painel promete.
rotasAdmin.delete("/servicos/:id", async (req, res) => {
  await prisma.service.update({
    where: { id: String(req.params.id) },
    data: { active: false },
  });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Cursos e aulas
// ---------------------------------------------------------------------------

rotasAdmin.get("/cursos", async (_req, res) => {
  res.json(
    await prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        lessons: { orderBy: { position: "asc" } },
        _count: { select: { enrollments: true } },
      },
    }),
  );
});

function dadosCurso(corpo: Record<string, unknown>) {
  const erros: string[] = [];
  const title = texto(corpo.title);
  const slug = texto(corpo.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const priceCents = inteiro(corpo.priceCents);

  if (title.length < 3) erros.push("Informe o título do curso.");
  if (priceCents === null || priceCents < 0) erros.push("Preço inválido.");

  return {
    erros,
    dados: {
      slug,
      title,
      subtitle: texto(corpo.subtitle) || null,
      description: texto(corpo.description),
      priceCents: priceCents ?? 0,
      coverImage: texto(corpo.coverImage) || null,
      level: texto(corpo.level) || null,
      durationHours: inteiro(corpo.durationHours),
      forWho: texto(corpo.forWho) || null,
      includes: Array.isArray(corpo.includes)
        ? (corpo.includes as unknown[]).map((i) => texto(i)).filter(Boolean)
        : [],
      published: corpo.published === true,
    },
  };
}

rotasAdmin.post("/cursos", async (req, res) => {
  const { erros, dados } = dadosCurso(req.body ?? {});
  if (erros.length) {
    res.status(400).json({ erros });
    return;
  }
  res.status(201).json(await prisma.course.create({ data: dados }));
});

rotasAdmin.patch("/cursos/:id", async (req, res) => {
  const { erros, dados } = dadosCurso(req.body ?? {});
  if (erros.length) {
    res.status(400).json({ erros });
    return;
  }
  res.json(await prisma.course.update({ where: { id: String(req.params.id) }, data: dados }));
});

rotasAdmin.delete("/cursos/:id", async (req, res) => {
  const id = String(req.params.id);

  // Curso com aluna matriculada não é apagado: isso tiraria o acesso de quem
  // pagou. Despublicar resolve o que o painel quer.
  const matriculas = await prisma.enrollment.count({ where: { courseId: id } });
  if (matriculas > 0) {
    await prisma.course.update({ where: { id }, data: { published: false } });
    res.json({ ok: true, despublicado: true, matriculas });
    return;
  }

  const aulas = await prisma.lesson.findMany({
    where: { courseId: id },
    select: { videoPath: true },
  });

  await prisma.course.delete({ where: { id } });

  for (const aula of aulas) {
    if (aula.videoPath) {
      await fs.rm(path.join(dirVideos, path.basename(aula.videoPath)), { force: true });
    }
  }

  res.json({ ok: true });
});

rotasAdmin.post("/cursos/:id/aulas", async (req, res) => {
  const courseId = String(req.params.id);
  const title = texto(req.body?.title);

  if (title.length < 2) {
    res.status(400).json({ erros: ["Informe o título da aula."] });
    return;
  }

  const ultima = await prisma.lesson.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  res.status(201).json(
    await prisma.lesson.create({
      data: {
        courseId,
        title,
        description: texto(req.body?.description) || null,
        gratuita: req.body?.gratuita === true,
        position: (ultima?.position ?? 0) + 1,
      },
    }),
  );
});

rotasAdmin.patch("/aulas/:id", async (req, res) => {
  const dados: Record<string, unknown> = {};
  if (req.body?.title !== undefined) dados.title = texto(req.body.title);
  if (req.body?.description !== undefined) dados.description = texto(req.body.description) || null;
  if (req.body?.gratuita !== undefined) dados.gratuita = req.body.gratuita === true;
  if (req.body?.durationSeconds !== undefined) {
    dados.durationSeconds = inteiro(req.body.durationSeconds);
  }

  res.json(await prisma.lesson.update({ where: { id: String(req.params.id) }, data: dados }));
});

rotasAdmin.delete("/aulas/:id", async (req, res) => {
  const aula = await prisma.lesson.delete({ where: { id: String(req.params.id) } });
  if (aula.videoPath) {
    await fs.rm(path.join(dirVideos, path.basename(aula.videoPath)), { force: true });
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Vendas
// ---------------------------------------------------------------------------

rotasAdmin.get("/pedidos", async (_req, res) => {
  res.json(
    await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        amountCents: true,
        createdAt: true,
        paidAt: true,
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
  );
});

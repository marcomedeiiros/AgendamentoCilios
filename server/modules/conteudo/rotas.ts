import { Router } from "express";

import { prisma } from "../shared/prisma";

export const rotasConteudo = Router();

/**
 * Conteúdo editável do site (contato, fotos, números da home).
 *
 * Devolve um objeto com uma chave por bloco. O front tem os mesmos dados como
 * padrão embutido: se o banco estiver vazio ou fora do ar, o site não muda.
 */
rotasConteudo.get("/", async (_req, res) => {
  const blocos = await prisma.siteContent.findMany();
  res.json(Object.fromEntries(blocos.map((b) => [b.key, b.value])));
});

/** Serviços ativos, na ordem definida no painel. */
rotasConteudo.get("/servicos", async (_req, res) => {
  const servicos = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      description: true,
      durationMinutes: true,
      maintenance: true,
      priceCents: true,
      imageUrl: true,
    },
  });

  res.json(servicos);
});

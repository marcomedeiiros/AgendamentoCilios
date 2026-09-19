import { Router } from "express";

import { prisma } from "../shared/prisma";
import { exigirLogin } from "../identity/sessao";

export const rotasCursos = Router();

/** Catálogo público: só o que está publicado, sem caminho de vídeo. */
rotasCursos.get("/", async (_req, res) => {
  const cursos = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      priceCents: true,
      coverImage: true,
      level: true,
      durationHours: true,
      _count: { select: { lessons: true } },
    },
  });

  res.json(
    cursos.map(({ _count, ...curso }) => ({ ...curso, totalAulas: _count.lessons })),
  );
});

/**
 * Detalhe do curso. A lista de aulas vem sempre (é vitrine), mas só quem tem
 * matrícula recebe `liberada: true` — o vídeo em si depende de outra checagem,
 * feita na rota de streaming.
 */
rotasCursos.get("/:slug", async (req, res) => {
  const curso = await prisma.course.findFirst({
    where: { slug: String(req.params.slug), published: true },
    include: {
      lessons: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          durationSeconds: true,
          gratuita: true,
          videoPath: true,
        },
      },
    },
  });

  if (!curso) {
    res.status(404).json({ erros: ["Curso não encontrado."] });
    return;
  }

  const matriculada = req.usuario
    ? Boolean(
        await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: req.usuario.id, courseId: curso.id } },
          select: { id: true },
        }),
      )
    : false;

  res.json({
    id: curso.id,
    slug: curso.slug,
    title: curso.title,
    subtitle: curso.subtitle,
    description: curso.description,
    priceCents: curso.priceCents,
    coverImage: curso.coverImage,
    level: curso.level,
    durationHours: curso.durationHours,
    forWho: curso.forWho,
    includes: curso.includes,
    matriculada,
    aulas: curso.lessons.map((aula) => ({
      id: aula.id,
      title: aula.title,
      description: aula.description,
      position: aula.position,
      durationSeconds: aula.durationSeconds,
      gratuita: aula.gratuita,
      temVideo: Boolean(aula.videoPath),
      liberada: matriculada || aula.gratuita,
    })),
  });
});

/** Cursos que a pessoa logada comprou. */
rotasCursos.get("/minhas/matriculas", exigirLogin, async (req, res) => {
  const matriculas = await prisma.enrollment.findMany({
    where: { userId: req.usuario!.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      course: {
        select: {
          slug: true,
          title: true,
          subtitle: true,
          coverImage: true,
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  res.json(
    matriculas.map((m) => ({
      compradoEm: m.createdAt,
      slug: m.course.slug,
      title: m.course.title,
      subtitle: m.course.subtitle,
      coverImage: m.course.coverImage,
      totalAulas: m.course._count.lessons,
    })),
  );
});

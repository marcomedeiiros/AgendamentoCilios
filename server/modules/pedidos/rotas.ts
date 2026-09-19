import { Router } from "express";

import { prisma } from "../shared/prisma";
import { exigirLogin } from "../identity/sessao";
import { MercadoPagoNaoConfigurado, criarPreferencia } from "../pagamentos/mercadopago";

export const rotasPedidos = Router();

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
const API_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Inicia a compra de um curso: cria o pedido como PENDING e devolve a URL do
 * checkout. Quem libera o acesso é o webhook, nunca esta rota o retorno do
 * navegador é controlado pela cliente e não prova pagamento nenhum.
 */
rotasPedidos.post("/", exigirLogin, async (req, res) => {
  const { cursoSlug } = (req.body ?? {}) as { cursoSlug?: unknown };

  if (typeof cursoSlug !== "string" || !cursoSlug) {
    res.status(400).json({ erros: ["Informe o curso."] });
    return;
  }

  const curso = await prisma.course.findFirst({
    where: { slug: cursoSlug, published: true },
  });

  if (!curso) {
    res.status(404).json({ erros: ["Curso não encontrado."] });
    return;
  }

  const jaTem = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.usuario!.id, courseId: curso.id } },
    select: { id: true },
  });

  if (jaTem) {
    res.status(409).json({ erros: ["Você já tem acesso a este curso."] });
    return;
  }

  // O valor cobrado é o preço de agora, congelado no pedido.
  const pedido = await prisma.order.create({
    data: {
      userId: req.usuario!.id,
      courseId: curso.id,
      amountCents: curso.priceCents,
    },
  });

  try {
    const { preferenceId, urlCheckout } = await criarPreferencia({
      titulo: curso.title,
      descricao: curso.subtitle ?? curso.title,
      precoCentavos: curso.priceCents,
      externalReference: pedido.id,
      emailComprador: req.usuario!.email,
      urlRetorno: `${APP_URL}/pagamento/retorno`,
      urlWebhook: `${API_URL}/api/pagamentos/mercadopago/webhook`,
    });

    await prisma.order.update({
      where: { id: pedido.id },
      data: { providerPreferenceId: preferenceId },
    });

    res.status(201).json({ pedidoId: pedido.id, urlCheckout });
  } catch (erro) {
    await prisma.order.update({
      where: { id: pedido.id },
      data: { status: "FAILED" },
    });

    if (erro instanceof MercadoPagoNaoConfigurado) {
      res.status(503).json({
        erros: ["O pagamento ainda não está configurado neste ambiente."],
      });
      return;
    }

    console.error("Falha ao criar preferência no Mercado Pago:", erro);
    res.status(502).json({ erros: ["Não foi possível abrir o pagamento. Tente de novo."] });
  }
});

/** Situação de um pedidoa tela de retorno consulta isto. */
rotasPedidos.get("/:id", exigirLogin, async (req, res) => {
  const pedido = await prisma.order.findFirst({
    where: { id: String(req.params.id), userId: req.usuario!.id },
    select: {
      id: true,
      status: true,
      amountCents: true,
      paidAt: true,
      course: { select: { slug: true, title: true } },
    },
  });

  if (!pedido) {
    res.status(404).json({ erros: ["Pedido não encontrado."] });
    return;
  }

  res.json(pedido);
});

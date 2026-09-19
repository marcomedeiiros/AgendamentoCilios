import { Router } from "express";

import { prisma } from "../shared/prisma";
import { assinaturaValida, buscarPagamento, configurado } from "./mercadopago";

export const rotasPagamentos = Router();

rotasPagamentos.get("/status", (_req, res) => {
  res.json({ mercadopago: configurado() });
});

/**
 * Webhook do Mercado Pago. É a ÚNICA porta que libera acesso a curso.
 *
 * Três cuidados que o fluxo exige:
 *  - assinatura conferida antes de qualquer coisa, senão qualquer um libera
 *    curso mandando um POST;
 *  - o valor e o status vêm da API do Mercado Pago, não do corpo recebido;
 *  - reprocessamento é normal (o MP reenvia), então tudo é idempotente.
 *
 * Responde 200 mesmo em caso ignorado: erro faz o MP reenviar por horas.
 */
rotasPagamentos.post("/mercadopago/webhook", async (req, res) => {
  const dataId =
    (req.query["data.id"] as string | undefined) ??
    (req.body?.data?.id !== undefined ? String(req.body.data.id) : undefined);

  const valida = assinaturaValida({
    xSignature: req.header("x-signature") ?? undefined,
    xRequestId: req.header("x-request-id") ?? undefined,
    dataId,
  });

  if (!valida) {
    console.warn("Webhook do Mercado Pago recusado: assinatura inválida.");
    res.status(401).json({ erro: "assinatura inválida" });
    return;
  }

  const tipo = req.body?.type ?? req.query.type;
  if (tipo !== "payment" || !dataId) {
    res.status(200).json({ ignorado: true });
    return;
  }

  try {
    const pagamento = await buscarPagamento(dataId);
    const pedidoId = pagamento.external_reference;

    if (!pedidoId) {
      res.status(200).json({ ignorado: true });
      return;
    }

    const pedido = await prisma.order.findUnique({ where: { id: pedidoId } });
    if (!pedido) {
      console.warn(`Webhook citou pedido inexistente: ${pedidoId}`);
      res.status(200).json({ ignorado: true });
      return;
    }

    if (pagamento.status !== "approved") {
      await prisma.order.update({
        where: { id: pedido.id },
        data: {
          status: pagamento.status === "rejected" || pagamento.status === "cancelled"
            ? "FAILED"
            : pagamento.status === "refunded"
              ? "REFUNDED"
              : "PENDING",
          providerPaymentId: String(pagamento.id),
        },
      });
      res.status(200).json({ ok: true });
      return;
    }

    // Confere se o valor pago bate com o cobrado. Divergência não libera nada.
    const pagoCentavos = Math.round(pagamento.transaction_amount * 100);
    if (pagoCentavos !== pedido.amountCents) {
      console.error(
        `Valor divergente no pedido ${pedido.id}: cobrado ${pedido.amountCents}, pago ${pagoCentavos}`,
      );
      res.status(200).json({ ignorado: true });
      return;
    }

    // Marcar como pago e matricular acontecem juntos ou não acontecem.
    await prisma.$transaction([
      prisma.order.update({
        where: { id: pedido.id },
        data: {
          status: "PAID",
          paidAt: pedido.paidAt ?? new Date(),
          providerPaymentId: String(pagamento.id),
        },
      }),
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId: pedido.userId, courseId: pedido.courseId } },
        create: { userId: pedido.userId, courseId: pedido.courseId, orderId: pedido.id },
        update: {},
      }),
    ]);

    res.status(200).json({ ok: true });
  } catch (erro) {
    console.error("Erro ao processar webhook do Mercado Pago:", erro);
    // 500 faz o Mercado Pago tentar de novo, que é o desejado aqui.
    res.status(500).json({ erro: "falha ao processar" });
  }
});

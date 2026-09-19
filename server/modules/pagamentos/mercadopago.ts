import { createHmac, timingSafeEqual } from "node:crypto";

// Integração via API HTTP do Mercado Pago (Checkout Pro). Não usamos SDK: são
// três chamadas e uma validação de assinatura, e assim não entra dependência
// nova para manter atualizada.
//
// O access token é secreto e só existe aqui no servidor. O cartão da cliente
// nunca passa pela nossa aplicação ela paga na página do Mercado Pago.
const API = "https://api.mercadopago.com";

export class MercadoPagoNaoConfigurado extends Error {
  constructor() {
    super("MERCADOPAGO_ACCESS_TOKEN não está definido no .env.");
    this.name = "MercadoPagoNaoConfigurado";
  }
}

function token() {
  const valor = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!valor) throw new MercadoPagoNaoConfigurado();
  return valor;
}

export function configurado() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Mercado Pago respondeu ${resposta.status}: ${corpo.slice(0, 300)}`);
  }

  return (await resposta.json()) as T;
}

type Preferencia = { id: string; init_point: string; sandbox_init_point: string };

/**
 * Cria a preferência de pagamento e devolve a URL do checkout.
 * `externalReference` é o id do nosso pedido é por ele que o webhook
 * encontra a compra depois.
 */
export async function criarPreferencia(entrada: {
  titulo: string;
  descricao: string;
  precoCentavos: number;
  quantidade?: number;
  externalReference: string;
  emailComprador: string;
  urlRetorno: string;
  urlWebhook: string;
}): Promise<{ preferenceId: string; urlCheckout: string }> {
  const dados = await chamar<Preferencia>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          id: entrada.externalReference,
          title: entrada.titulo,
          description: entrada.descricao,
          quantity: entrada.quantidade ?? 1,
          currency_id: "BRL",
          // A API trabalha em reais com decimal; internamente só usamos centavos.
          unit_price: entrada.precoCentavos / 100,
        },
      ],
      payer: { email: entrada.emailComprador },
      external_reference: entrada.externalReference,
      notification_url: entrada.urlWebhook,
      back_urls: {
        success: `${entrada.urlRetorno}?status=sucesso`,
        pending: `${entrada.urlRetorno}?status=pendente`,
        failure: `${entrada.urlRetorno}?status=falha`,
      },
      auto_return: "approved",
statement_descriptor: "ALICIA LASH",
    }),
  });

  // Credencial de teste devolve as duas URLs; a de produção usa init_point.
  const sandbox = token().startsWith("TEST-");
  return {
    preferenceId: dados.id,
    urlCheckout: sandbox ? (dados.sandbox_init_point ?? dados.init_point) : dados.init_point,
  };
}

export type Pagamento = {
  id: number;
  status: "approved" | "pending" | "in_process" | "rejected" | "refunded" | "cancelled" | string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
};

export function buscarPagamento(id: string) {
  return chamar<Pagamento>(`/v1/payments/${id}`);
}

/**
 * Confere a assinatura do webhook (cabeçalhos x-signature e x-request-id).
 * Sem isso, qualquer pessoa que descubra a URL poderia liberar curso de graça
 * mandando uma notificação falsa.
 */
export function assinaturaValida(entrada: {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
}): boolean {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo) return false;
  if (!entrada.xSignature || !entrada.dataId) return false;

  const partes = Object.fromEntries(
    entrada.xSignature.split(",").map((p) => {
      const [chave, ...resto] = p.split("=");
      return [chave.trim(), resto.join("=").trim()];
    }),
  );

  const ts = partes.ts;
  const hash = partes.v1;
  if (!ts || !hash) return false;

  const manifesto = `id:${entrada.dataId};request-id:${entrada.xRequestId ?? ""};ts:${ts};`;
  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(hash, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Curso = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number;
  coverImage: string | null;
  totalAulas: number;
};

export type Aula = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  durationSeconds: number | null;
  gratuita: boolean;
  temVideo: boolean;
  liberada: boolean;
};

export type CursoDetalhe = Omit<Curso, 'totalAulas'> & {
  matriculada: boolean;
  aulas: Aula[];
};

export type Matricula = {
  compradoEm: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImage: string | null;
  totalAulas: number;
};

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly erros: string[],
  ) {
    super(erros[0] ?? 'Erro inesperado.');
  }
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(caminho, {
    ...init,
    // O cookie de sessão precisa acompanhar toda chamada autenticada.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erros?: string[] } | null;
    throw new ErroApi(resposta.status, corpo?.erros ?? ['Não foi possível completar a ação.']);
  }

  return (await resposta.json()) as T;
}

export const api = {
  cursos: () => pedir<Curso[]>('/api/cursos'),
  curso: (slug: string) => pedir<CursoDetalhe>(`/api/cursos/${slug}`),
  minhasMatriculas: () => pedir<Matricula[]>('/api/cursos/minhas/matriculas'),
  comprar: (cursoSlug: string) =>
    pedir<{ pedidoId: string; urlCheckout: string }>('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ cursoSlug }),
    }),
  pedido: (id: string) =>
    pedir<{
      id: string;
      status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
      amountCents: number;
      paidAt: string | null;
      course: { slug: string; title: string };
    }>(`/api/pedidos/${id}`),
};

export function formatarPreco(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarDuracao(segundos: number | null) {
  if (!segundos) return null;
  const min = Math.round(segundos / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

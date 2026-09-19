import { ErroApi } from './api';

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`/api/admin${caminho}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erros?: string[] } | null;
    throw new ErroApi(resposta.status, corpo?.erros ?? ['Não foi possível completar a ação.']);
  }

  return (await resposta.json()) as T;
}

export type DepoimentoAdmin = {
  id: string;
  nome: string;
  texto: string;
  nota: number;
  servico: string;
  foto: string | null;
  criadoEm: string;
  aprovado: boolean;
};

export type ServicoAdmin = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  maintenance: string | null;
  priceCents: number;
  depositCents: number;
  imageUrl: string | null;
  position: number;
  active: boolean;
};

export type AulaAdmin = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  gratuita: boolean;
  videoPath: string | null;
  videoBytes: number | null;
  durationSeconds: number | null;
};

export type CursoAdmin = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  priceCents: number;
  coverImage: string | null;
  level: string | null;
  durationHours: number | null;
  forWho: string | null;
  includes: string[];
  published: boolean;
  lessons: AulaAdmin[];
  _count: { enrollments: number };
};

export type PedidoAdmin = {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  amountCents: number;
  createdAt: string;
  paidAt: string | null;
  user: { name: string; email: string };
  course: { title: string };
};

export const adminApi = {
  // Depoimentos
  depoimentos: () => pedir<DepoimentoAdmin[]>('/depoimentos'),
  aprovarDepoimento: (id: string, aprovado: boolean) =>
    pedir(`/depoimentos/${id}`, { method: 'PATCH', body: JSON.stringify({ aprovado }) }),
  excluirDepoimento: (id: string) => pedir(`/depoimentos/${id}`, { method: 'DELETE' }),

  // Serviços
  servicos: () => pedir<ServicoAdmin[]>('/servicos'),
  criarServico: (dados: Partial<ServicoAdmin>) =>
    pedir<ServicoAdmin>('/servicos', { method: 'POST', body: JSON.stringify(dados) }),
  salvarServico: (id: string, dados: Partial<ServicoAdmin>) =>
    pedir<ServicoAdmin>(`/servicos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluirServico: (id: string) => pedir(`/servicos/${id}`, { method: 'DELETE' }),

  // Cursos e aulas
  cursos: () => pedir<CursoAdmin[]>('/cursos'),
  criarCurso: (dados: Partial<CursoAdmin>) =>
    pedir<CursoAdmin>('/cursos', { method: 'POST', body: JSON.stringify(dados) }),
  salvarCurso: (id: string, dados: Partial<CursoAdmin>) =>
    pedir<CursoAdmin>(`/cursos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluirCurso: (id: string) =>
    pedir<{ despublicado?: boolean; matriculas?: number }>(`/cursos/${id}`, { method: 'DELETE' }),
  criarAula: (cursoId: string, dados: { title: string; gratuita?: boolean }) =>
    pedir<AulaAdmin>(`/cursos/${cursoId}/aulas`, { method: 'POST', body: JSON.stringify(dados) }),
  salvarAula: (id: string, dados: Partial<AulaAdmin>) =>
    pedir<AulaAdmin>(`/aulas/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluirAula: (id: string) => pedir(`/aulas/${id}`, { method: 'DELETE' }),

  // Conteúdo do site
  salvarConteudo: (chave: string, valor: unknown) =>
    pedir(`/conteudo/${chave}`, { method: 'PUT', body: JSON.stringify({ valor }) }),

  // Imagens
  enviarImagem: (dataUrl: string) =>
    pedir<{ url: string }>('/imagens', { method: 'POST', body: JSON.stringify({ imagem: dataUrl }) }),

  // Vendas
  pedidos: () => pedir<PedidoAdmin[]>('/pedidos'),
};

/**
 * Sobe o vídeo da aula. Vai como corpo cru em PUT: multipart em memória
 * estouraria com arquivo de aula.
 */
export async function enviarVideo(aulaId: string, arquivo: File) {
  const resposta = await fetch(`/api/aulas/${aulaId}/video`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': arquivo.type },
    body: arquivo,
  });

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erros?: string[] } | null;
    throw new ErroApi(resposta.status, corpo?.erros ?? ['Falha ao enviar o vídeo.']);
  }

  return (await resposta.json()) as { ok: true; bytes: number };
}

export function reaisParaCentavos(texto: string) {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round(Number(limpo || 0) * 100);
}

export function centavosParaReais(centavos: number) {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

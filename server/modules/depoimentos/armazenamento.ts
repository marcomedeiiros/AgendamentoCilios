import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Os depoimentos vivem em arquivo, não no Prisma: o cliente do Prisma ainda não
// está gerado neste projeto e esta funcionalidade não precisa de banco para
// funcionar. O formato abaixo mapeia 1:1 para uma tabela quando a migração vier.
const dirDados = path.resolve(process.cwd(), 'server/data');
const dirUploads = path.join(dirDados, 'uploads');
const arquivo = path.join(dirDados, 'depoimentos.json');

export type Depoimento = {
  id: string;
  nome: string;
  texto: string;
  nota: number;
  servico: string;
  foto: string | null;
  criadoEm: string;
  /** Nada aparece no site antes de alguém do studio marcar como true. */
  aprovado: boolean;
};

export const uploadsPath = dirUploads;

async function garantirPastas() {
  await fs.mkdir(dirUploads, { recursive: true });
}

// Toda leitura/escrita entra nesta fila. Duas requisições simultâneas fariam
// read-modify-write em cima da mesma versão e uma sobrescreveria a outra.
let fila: Promise<unknown> = Promise.resolve();

function enfileirar<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = fila.then(tarefa, tarefa);
  fila = resultado.catch(() => undefined);
  return resultado;
}

async function lerTodos(): Promise<Depoimento[]> {
  try {
    const bruto = await fs.readFile(arquivo, 'utf8');
    const dados: unknown = JSON.parse(bruto);
    return Array.isArray(dados) ? (dados as Depoimento[]) : [];
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw erro;
  }
}

export function listarAprovados(): Promise<Depoimento[]> {
  return enfileirar(async () => {
    const todos = await lerTodos();
    return todos
      .filter((d) => d.aprovado)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  });
}

export function salvar(
  novo: Omit<Depoimento, 'id' | 'criadoEm' | 'aprovado'>,
): Promise<Depoimento> {
  return enfileirar(async () => {
    await garantirPastas();
    const todos = await lerTodos();
    const depoimento: Depoimento = {
      ...novo,
      id: randomUUID(),
      criadoEm: new Date().toISOString(),
      aprovado: false,
    };
    todos.push(depoimento);
    await fs.writeFile(arquivo, JSON.stringify(todos, null, 2), 'utf8');
    return depoimento;
  });
}

const tiposAceitos: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024;

/**
 * Grava a foto que veio como data URL e devolve o caminho público.
 * Retorna null quando não há foto; lança quando o conteúdo é inválido.
 */
export async function gravarFoto(dataUrl: string | undefined): Promise<string | null> {
  if (!dataUrl) return null;

  const partes = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!partes) throw new Error('Formato de imagem não reconhecido.');

  const extensao = tiposAceitos[partes[1]];
  if (!extensao) throw new Error('Envie a foto em JPG, PNG ou WebP.');

  const binario = Buffer.from(partes[2], 'base64');
  if (binario.byteLength === 0) throw new Error('A imagem chegou vazia.');
  if (binario.byteLength > TAMANHO_MAXIMO_FOTO) throw new Error('A imagem é grande demais.');

  await garantirPastas();
  const nomeArquivo = `${randomUUID()}${extensao}`;
  await fs.writeFile(path.join(dirUploads, nomeArquivo), binario);
  return `/uploads/${nomeArquivo}`;
}

import { Router } from 'express';
import type { Request } from 'express';
import { gravarFoto, listarAprovados, salvar } from './armazenamento';

export const rotasDepoimentos = Router();

const SERVICOS = [
  'Extensão fio a fio',
  'Volume russo',
  'Lash lifting',
  'Manutenção',
  'Curso / formação',
];

type Corpo = {
  nome?: unknown;
  texto?: unknown;
  nota?: unknown;
  servico?: unknown;
  foto?: unknown;
};

function validar(corpo: Corpo) {
  const erros: string[] = [];

  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';
  if (nome.length < 2 || nome.length > 60) {
    erros.push('Informe um nome entre 2 e 60 caracteres.');
  }

  const texto = typeof corpo.texto === 'string' ? corpo.texto.trim() : '';
  if (texto.length < 10 || texto.length > 500) {
    erros.push('O depoimento precisa ter de 10 a 500 caracteres.');
  }

  const nota = Number(corpo.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    erros.push('A nota precisa ser um número de 1 a 5.');
  }

  const servico = typeof corpo.servico === 'string' ? corpo.servico : '';
  if (!SERVICOS.includes(servico)) {
    erros.push('Selecione um dos serviços disponíveis.');
  }

  if (corpo.foto !== undefined && typeof corpo.foto !== 'string') {
    erros.push('Foto inválida.');
  }

  return { erros, nome, texto, nota, servico, foto: corpo.foto as string | undefined };
}

// Limite simples em memória. Não sobrevive a um restart e não cobre vários
// processos — segura envio repetido do mesmo navegador, que é o caso comum.
const envios = new Map<string, number[]>();
const JANELA_MS = 60 * 60 * 1000;
const MAXIMO_POR_HORA = 5;

function excedeuLimite(req: Request) {
  const chave = req.ip ?? 'desconhecido';
  const agora = Date.now();
  const recentes = (envios.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);

  if (recentes.length >= MAXIMO_POR_HORA) {
    envios.set(chave, recentes);
    return true;
  }

  recentes.push(agora);
  envios.set(chave, recentes);
  return false;
}

rotasDepoimentos.get('/', async (_req, res) => {
  try {
    const aprovados = await listarAprovados();
    res.json(
      aprovados.map(({ nome, texto, nota, servico, foto, criadoEm }) => ({
        nome,
        texto,
        nota,
        servico,
        foto,
        criadoEm,
      })),
    );
  } catch {
    res.status(500).json({ erros: ['Não foi possível carregar os depoimentos.'] });
  }
});

rotasDepoimentos.post('/', async (req, res) => {
  if (excedeuLimite(req)) {
    res.status(429).json({ erros: ['Muitos envios seguidos. Tente novamente mais tarde.'] });
    return;
  }

  const { erros, nome, texto, nota, servico, foto } = validar(req.body ?? {});
  if (erros.length > 0) {
    res.status(400).json({ erros });
    return;
  }

  let caminhoFoto: string | null = null;
  try {
    caminhoFoto = await gravarFoto(foto);
  } catch (erro) {
    res.status(400).json({ erros: [(erro as Error).message] });
    return;
  }

  try {
    await salvar({ nome, texto, nota, servico, foto: caminhoFoto });
    // Responde sem o registro: ele ainda não é público.
    res.status(201).json({ mensagem: 'Depoimento recebido e aguardando conferência.' });
  } catch {
    res.status(500).json({ erros: ['Não foi possível salvar o depoimento.'] });
  }
});

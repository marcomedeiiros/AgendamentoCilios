import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import {
  adminApi,
  centavosParaReais,
  enviarVideo,
  reaisParaCentavos,
  type AulaAdmin,
  type CursoAdmin,
} from '../lib/adminApi';
import { Botao, Campo, EscolherImagem, Erros, campo } from './componentes';

type Rascunho = Partial<CursoAdmin> & { precoTexto?: string; incluiTexto?: string };

const vazio: Rascunho = {
  title: '',
  subtitle: '',
  description: '',
  precoTexto: '0,00',
  level: '',
  forWho: '',
  incluiTexto: '',
  published: false,
};

export default function PainelCursos() {
  const [itens, setItens] = useState<CursoAdmin[] | null>(null);
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    adminApi
      .cursos()
      .then(setItens)
      .catch((e) => {
        setErros([(e as Error).message]);
        setItens([]);
      });
  }

  useEffect(carregar, []);

  async function salvar() {
    if (!editando) return;
    setErros([]);
    setSalvando(true);

    const dados = {
      ...editando,
      priceCents: reaisParaCentavos(editando.precoTexto ?? '0'),
      includes: (editando.incluiTexto ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    };

    try {
      if (editando.id) await adminApi.salvarCurso(editando.id, dados);
      else await adminApi.criarCurso(dados);
      setEditando(null);
      carregar();
    } catch (e) {
      setErros((e as { erros?: string[] }).erros ?? [(e as Error).message]);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(curso: CursoAdmin) {
    if (!confirm(`Excluir o curso "${curso.title}"?`)) return;
    const r = await adminApi.excluirCurso(curso.id);
    if (r.despublicado) {
      alert(
        `O curso tem ${r.matriculas} aluna(s) matriculada(s), então ele não foi apagado — só saiu do site. Apagar tiraria o acesso de quem pagou.`,
      );
    }
    carregar();
  }

  if (itens === null) return <p className="text-ink-soft">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Cursos online</h2>
        <Botao onClick={() => setEditando({ ...vazio })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo curso
        </Botao>
      </div>

      <Erros erros={erros} />

      {editando && (
        <div className="space-y-5 rounded-[1.5rem] border border-blush-200 bg-sand p-6 md:p-8">
          <h3 className="font-display text-xl text-ink">
            {editando.id ? 'Editando curso' : 'Novo curso'}
          </h3>

          <div className="grid gap-5 md:grid-cols-2">
            <Campo label="Título">
              <input
                className={campo}
                value={editando.title ?? ''}
                onChange={(e) => setEditando({ ...editando, title: e.target.value })}
              />
            </Campo>

            <Campo label="Subtítulo">
              <input
                className={campo}
                value={editando.subtitle ?? ''}
                onChange={(e) => setEditando({ ...editando, subtitle: e.target.value })}
              />
            </Campo>

            <Campo label="Preço (R$)">
              <input
                className={campo}
                value={editando.precoTexto ?? ''}
                onChange={(e) => setEditando({ ...editando, precoTexto: e.target.value })}
              />
            </Campo>

            <Campo label="Nível" dica='Ex.: "Do zero ao avançado"'>
              <input
                className={campo}
                value={editando.level ?? ''}
                onChange={(e) => setEditando({ ...editando, level: e.target.value })}
              />
            </Campo>

            <Campo label="Carga horária (horas)">
              <input
                type="number"
                className={campo}
                value={editando.durationHours ?? ''}
                onChange={(e) =>
                  setEditando({ ...editando, durationHours: Number(e.target.value) })
                }
              />
            </Campo>
          </div>

          <Campo label="Descrição">
            <textarea
              rows={4}
              className={`${campo} resize-none`}
              value={editando.description ?? ''}
              onChange={(e) => setEditando({ ...editando, description: e.target.value })}
            />
          </Campo>

          <Campo label="Para quem é">
            <textarea
              rows={2}
              className={`${campo} resize-none`}
              value={editando.forWho ?? ''}
              onChange={(e) => setEditando({ ...editando, forWho: e.target.value })}
            />
          </Campo>

          <Campo label="O que a aluna recebe" dica="Um item por linha">
            <textarea
              rows={4}
              className={`${campo} resize-none`}
              value={editando.incluiTexto ?? ''}
              onChange={(e) => setEditando({ ...editando, incluiTexto: e.target.value })}
            />
          </Campo>

          <Campo label="Capa do curso">
            <EscolherImagem
              valor={editando.coverImage ?? null}
              aoMudar={(url) => setEditando({ ...editando, coverImage: url })}
            />
          </Campo>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={editando.published ?? false}
              onChange={(e) => setEditando({ ...editando, published: e.target.checked })}
              className="h-4 w-4 accent-blush-600"
            />
            <span className="text-sm font-semibold text-ink">Publicado no site</span>
          </label>

          <div className="flex gap-3">
            <Botao onClick={salvar} carregando={salvando}>
              Salvar
            </Botao>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}

      {itens.length === 0 ? (
        <p className="text-ink-soft">Nenhum curso cadastrado.</p>
      ) : (
        <div className="space-y-6">
          {itens.map((curso) => (
            <CursoItem
              key={curso.id}
              curso={curso}
              aoEditar={() =>
                setEditando({
                  ...curso,
                  precoTexto: centavosParaReais(curso.priceCents),
                  incluiTexto: curso.includes.join('\n'),
                })
              }
              aoExcluir={() => excluir(curso)}
              aoMudar={carregar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CursoItem({
  curso,
  aoEditar,
  aoExcluir,
  aoMudar,
}: {
  curso: CursoAdmin;
  aoEditar: () => void;
  aoExcluir: () => void;
  aoMudar: () => void;
}) {
  const [novaAula, setNovaAula] = useState('');

  async function adicionarAula(e: React.FormEvent) {
    e.preventDefault();
    if (novaAula.trim().length < 2) return;
    await adminApi.criarAula(curso.id, { title: novaAula.trim() });
    setNovaAula('');
    aoMudar();
  }

  return (
    <article className="rounded-[1.5rem] border border-blush-100 bg-cream p-6">
      <div className="flex flex-wrap items-center gap-4">
        {curso.coverImage && (
          <img
            src={curso.coverImage}
            alt=""
            className="h-16 w-24 rounded-2xl border border-blush-100 object-cover"
          />
        )}

        <div className="min-w-[14rem] flex-grow">
          <p className="font-semibold text-ink">{curso.title}</p>
          <p className="text-sm text-ink-soft">
            R$ {centavosParaReais(curso.priceCents)} · {curso.lessons.length} aulas ·{' '}
            {curso._count.enrollments} aluna(s) ·{' '}
            {curso.published ? 'publicado' : 'rascunho'}
          </p>
        </div>

        <div className="flex gap-2">
          <Botao variante="secundario" onClick={aoEditar}>
            Editar
          </Botao>
          <Botao variante="perigo" onClick={aoExcluir}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Botao>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-blush-100 border-t border-blush-100">
        {curso.lessons.map((aula) => (
          <AulaItem key={aula.id} aula={aula} aoMudar={aoMudar} />
        ))}
      </ul>

      <form onSubmit={adicionarAula} className="mt-4 flex gap-3">
        <input
          className={campo}
          placeholder="Título da nova aula"
          value={novaAula}
          onChange={(e) => setNovaAula(e.target.value)}
        />
        <Botao type="submit" variante="secundario">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Aula
        </Botao>
      </form>
    </article>
  );
}

function AulaItem({ aula, aoMudar }: { aula: AulaAdmin; aoMudar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function subirVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setErro(null);
    setEnviando(true);
    try {
      await enviarVideo(aula.id, arquivo);
      aoMudar();
    } catch (erro) {
      setErro((erro as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="w-6 text-sm font-semibold text-blush-400">{aula.position}</span>

      <span className="min-w-[10rem] flex-grow">
        <span className="block text-sm font-medium text-ink">{aula.title}</span>
        <span className="text-xs text-ink-soft">
          {aula.videoPath
            ? `vídeo enviado (${Math.round((aula.videoBytes ?? 0) / 1024 / 1024)} MB)`
            : 'sem vídeo'}
          {aula.gratuita ? ' · amostra grátis' : ''}
        </span>
        {erro && <span className="block text-xs text-blush-800">{erro}</span>}
      </span>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blush-200 px-4 py-2 text-xs font-semibold text-ink hover:border-blush-400">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {enviando ? 'Enviando...' : aula.videoPath ? 'Trocar vídeo' : 'Enviar vídeo'}
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={subirVideo}
          className="sr-only"
        />
      </label>

      <label className="inline-flex items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          checked={aula.gratuita}
          onChange={async (e) => {
            await adminApi.salvarAula(aula.id, { gratuita: e.target.checked });
            aoMudar();
          }}
          className="h-3.5 w-3.5 accent-blush-600"
        />
        grátis
      </label>

      <button
        type="button"
        onClick={async () => {
          if (!confirm(`Excluir a aula "${aula.title}"?`)) return;
          await adminApi.excluirAula(aula.id);
          aoMudar();
        }}
        className="text-ink-soft transition-colors hover:text-blush-700"
        aria-label={`Excluir aula ${aula.title}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

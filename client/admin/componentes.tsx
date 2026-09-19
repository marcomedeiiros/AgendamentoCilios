import React, { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { prepararFoto } from '../lib/imagem';

export const campo =
  'w-full rounded-2xl border border-blush-200 bg-cream px-4 py-3 text-ink transition-colors placeholder:text-blush-300 focus:border-blush-500 focus:bg-white focus:outline-none';

export function Campo({
  label,
  children,
  dica,
}: {
  label: string;
  children: React.ReactNode;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-ink-soft">{dica}</span>}
    </label>
  );
}

export function Erros({ erros }: { erros: string[] }) {
  if (erros.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-blush-300 bg-blush-50 px-5 py-4 text-sm text-blush-800"
    >
      <ul className="space-y-1">
        {erros.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function Botao({
  children,
  carregando,
  variante = 'primario',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  carregando?: boolean;
  variante?: 'primario' | 'secundario' | 'perigo';
}) {
  const estilos = {
    primario: 'bg-blush-600 text-cream hover:bg-blush-700',
    secundario: 'border border-blush-200 text-ink hover:border-blush-400',
    perigo: 'border border-blush-300 text-blush-800 hover:bg-blush-50',
  }[variante];

  return (
    <button
      {...props}
      disabled={props.disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${estilos} ${props.className ?? ''}`}
    >
      {carregando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Escolhe uma imagem, reduz no navegador, sobe e devolve a URL gravada. */
export function EscolherImagem({
  valor,
  aoMudar,
}: {
  valor: string | null;
  aoMudar: (url: string | null) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setErro(null);
    setEnviando(true);
    try {
      const dataUrl = await prepararFoto(arquivo);
      const { url } = await adminApi.enviarImagem(dataUrl);
      aoMudar(url);
    } catch (erro) {
      setErro((erro as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {valor && (
          <img
            src={valor}
            alt="Imagem escolhida"
            className="h-20 w-20 rounded-2xl border border-blush-100 object-cover"
          />
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blush-200 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blush-400">
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          {valor ? 'Trocar imagem' : 'Escolher imagem'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selecionar}
            className="sr-only"
          />
        </label>

        {valor && (
          <button
            type="button"
            onClick={() => aoMudar(null)}
            className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-blush-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Remover
          </button>
        )}
      </div>
      {erro && <p className="mt-2 text-sm text-blush-800">{erro}</p>}
    </div>
  );
}

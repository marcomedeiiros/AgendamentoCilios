import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { servicosDepoimento } from '../data/site';
import { prepararFoto } from '../lib/imagem';

type Props = {
  aoEnviar: () => void;
  aoCancelar: () => void;
};

const campoBase =
  'w-full rounded-2xl border border-blush-200 bg-cream px-4 py-3.5 text-ink transition-colors placeholder:text-blush-300 focus:border-blush-500 focus:bg-white focus:outline-none';

const LIMITE_TEXTO = 500;

export default function FormularioDepoimento({ aoEnviar, aoCancelar }: Props) {
  const [nome, setNome] = useState('');
  const [servico, setServico] = useState('');
  const [nota, setNota] = useState(5);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  async function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    try {
      setFoto(await prepararFoto(arquivo));
      setErros([]);
    } catch (erro) {
      setErros([(erro as Error).message]);
      setFoto(null);
    } finally {
      // Permite escolher o mesmo arquivo de novo depois de remover.
      e.target.value = '';
    }
  }

  function removerFoto() {
    setFoto(null);
    inputFoto.current?.focus();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErros([]);

    try {
      const resposta = await fetch('/api/depoimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, servico, nota, texto, foto: foto ?? undefined }),
      });

      if (!resposta.ok) {
        const dados = (await resposta.json().catch(() => null)) as { erros?: string[] } | null;
        setErros(dados?.erros ?? ['Não foi possível enviar agora. Tente novamente.']);
        return;
      }

      aoEnviar();
    } catch {
      setErros(['Não conseguimos falar com o servidor. Verifique sua conexão.']);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-10 rounded-[1.75rem] border border-blush-100 bg-cream p-8 md:p-10"
      aria-label="Enviar depoimento"
    >
      <h3 className="font-display text-2xl text-ink">Conte como foi o seu atendimento</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Seu depoimento passa por uma conferência do studio antes de aparecer no site.
      </p>

      {erros.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-blush-300 bg-blush-50 px-5 py-4 text-sm text-blush-800"
        >
          <ul className="space-y-1">
            {erros.map((erro) => (
              <li key={erro}>{erro}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="dep-nome" className="mb-2 block text-sm font-semibold text-ink">
            Seu nome *
          </label>
          <input
            id="dep-nome"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            placeholder="Como quer assinar"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={campoBase}
          />
        </div>

        <div>
          <label htmlFor="dep-servico" className="mb-2 block text-sm font-semibold text-ink">
            O que você fez *
          </label>
          <select
            id="dep-servico"
            required
            value={servico}
            onChange={(e) => setServico(e.target.value)}
            className={`${campoBase} cursor-pointer`}
          >
            <option value="" disabled>
              Selecione o serviço
            </option>
            {servicosDepoimento.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold text-ink">Sua nota *</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setNota(valor)}
              aria-pressed={nota === valor}
              aria-label={`${valor} de 5 estrelas`}
              className="rounded-full p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${valor <= nota ? 'fill-gold text-gold' : 'text-blush-200'}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="dep-texto" className="mb-2 block text-sm font-semibold text-ink">
          Seu depoimento *
        </label>
        <textarea
          id="dep-texto"
          required
          rows={4}
          minLength={10}
          maxLength={LIMITE_TEXTO}
          placeholder="Como foi o atendimento, o resultado e a duração."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className={`${campoBase} resize-none`}
        />
        <p className="mt-2 text-right text-xs text-ink-soft">
          {texto.length}/{LIMITE_TEXTO}
        </p>
      </div>

      <div className="mt-4">
        <span className="mb-2 block text-sm font-semibold text-ink">Foto (opcional)</span>

        {foto ? (
          <div className="flex items-center gap-4">
            <img
              src={foto}
              alt="Pré-visualização da foto que você escolheu"
              className="h-24 w-24 rounded-2xl border border-blush-100 object-cover"
            />
            <button
              type="button"
              onClick={removerFoto}
              className="inline-flex items-center gap-2 rounded-full border border-blush-200 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blush-400"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Remover foto
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blush-200 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blush-400">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Escolher foto
            <input
              ref={inputFoto}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={selecionarFoto}
              className="sr-only"
            />
          </label>
        )}

        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          JPG, PNG ou WebP, até 8 MB. A imagem é reduzida antes do envio. Envie apenas fotos
          suas ou do seu resultado.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blush-600 px-8 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700 disabled:opacity-60"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {enviando ? 'Enviando...' : 'Enviar depoimento'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-full border border-blush-200 px-8 py-3.5 font-semibold text-ink transition-colors hover:border-blush-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

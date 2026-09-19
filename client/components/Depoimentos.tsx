import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Star } from 'lucide-react';
import { depoimentosFixos, type Depoimento } from '../data/site';
import FormularioDepoimento from './FormularioDepoimento';

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-1" aria-label={`Avaliação: ${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((valor) => (
        <Star
          key={valor}
          className={`h-4 w-4 ${valor <= nota ? 'fill-gold text-gold' : 'text-blush-200'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Cartao({ depoimento }: { depoimento: Depoimento }) {
  return (
    <figure className="flex h-full flex-col rounded-[1.75rem] border border-blush-100 bg-cream p-8">
      <Estrelas nota={depoimento.nota} />

      <blockquote className="mt-5 flex-grow leading-relaxed text-ink-soft">
        {depoimento.texto}
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-4 border-t border-blush-100 pt-5">
        {depoimento.foto && (
          <img
            src={depoimento.foto}
            alt=""
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-full border border-blush-100 object-cover"
          />
        )}
        <span>
          <span className="block font-semibold text-ink">{depoimento.nome}</span>
          <span className="text-sm text-ink-soft">{depoimento.servico}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Depoimentos() {
  const [enviados, setEnviados] = useState<Depoimento[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    const controle = new AbortController();

    fetch('/api/depoimentos', { signal: controle.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((dados: Depoimento[]) => setEnviados(Array.isArray(dados) ? dados : []))
      // A API pode estar fora do ar; a seção continua com os depoimentos fixos.
      .catch(() => undefined);

    return () => controle.abort();
  }, []);

  const lista = [...enviados, ...depoimentosFixos];

  return (
    <section
      id="depoimentos"
      className="scroll-mt-24 border-t border-blush-100 bg-sand py-20 md:py-28"
      aria-label="Depoimentos de clientes"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-blush-600">Depoimentos</p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              O que dizem as clientes
            </h2>
          </div>

          {!formAberto && (
            <button
              type="button"
              onClick={() => {
                setFormAberto(true);
                setConfirmado(false);
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-blush-300 bg-cream px-7 py-3.5 font-semibold text-ink transition-colors hover:border-blush-500"
            >
              <MessageSquarePlus className="h-5 w-5 text-blush-600" aria-hidden="true" />
              Deixar meu depoimento
            </button>
          )}
        </div>

        {confirmado && (
          <div
            role="status"
            className="mt-10 flex items-start gap-4 rounded-[1.75rem] border border-blush-200 bg-cream p-8"
          >
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-blush-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">Depoimento recebido, obrigada!</p>
              <p className="mt-1 leading-relaxed text-ink-soft">
                O studio confere antes de publicar, então ele ainda não aparece aqui embaixo.
              </p>
            </div>
          </div>
        )}

        {formAberto && (
          <FormularioDepoimento
            aoEnviar={() => {
              setFormAberto(false);
              setConfirmado(true);
            }}
            aoCancelar={() => setFormAberto(false)}
          />
        )}

        {lista.length === 0 ? (
          // O studio é novo: em vez de encher a seção com texto inventado, ela
          // convida quem já foi atendida a escrever o primeiro.
          <p className="mt-12 max-w-xl leading-relaxed text-ink-soft">
            Ainda não há depoimentos publicados. Se você já foi atendida aqui, seu relato ajuda
            quem está decidindo — e aparece nesta página depois da nossa conferência.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {lista.map((d) => (
              <Cartao key={`${d.nome}-${d.texto.slice(0, 24)}`} depoimento={d} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

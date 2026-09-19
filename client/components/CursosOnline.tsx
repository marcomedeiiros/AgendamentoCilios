import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Monitor } from 'lucide-react';
import { api, formatarPreco, type Curso } from '../lib/api';
import { catalogoExemplo } from '../data/cursosExemplo';

/**
 * Catálogo de cursos online.
 *
 * Quando a API não responde (banco ainda não configurado) mostra o conteúdo de
 * exemplo em modo prévia, para a página nunca ficar vazia — mas sem oferecer
 * compra, que aí não funcionaria mesmo.
 */
export default function CursosOnline() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [previa, setPrevia] = useState(false);

  useEffect(() => {
    api
      .cursos()
      .then((dados) => {
        if (dados.length > 0) {
          setCursos(dados);
          setPrevia(false);
        } else {
          setCursos(catalogoExemplo);
          setPrevia(true);
        }
      })
      .catch(() => {
        setCursos(catalogoExemplo);
        setPrevia(true);
      });
  }, []);

  if (cursos.length === 0) return null;

  return (
    <section id="online" className="scroll-mt-24 border-b border-blush-100 bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow text-blush-600">Online</p>
          <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
            Estude de onde você estiver
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Aulas gravadas, com acesso liberado assim que o pagamento é confirmado. Você assiste no
            seu ritmo, quantas vezes quiser.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {cursos.map((curso) => (
            <article
              key={curso.slug}
              className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-blush-100 bg-cream transition-shadow duration-300 hover:shadow-xl hover:shadow-blush-100"
            >
              {curso.coverImage && (
                <div className="h-52 overflow-hidden bg-sand">
                  <img
                    src={curso.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="flex flex-grow flex-col p-8">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-blush-700">
                    <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                    {curso.totalAulas} aulas
                  </span>
                  {curso.durationHours && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-blush-700">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {curso.durationHours}h de conteúdo
                    </span>
                  )}
                  {curso.level && (
                    <span className="inline-flex items-center rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink-soft">
                      {curso.level}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 font-display text-2xl text-ink">{curso.title}</h3>
                {curso.subtitle && <p className="mt-2 text-sm text-ink-soft">{curso.subtitle}</p>}
                <p className="mt-4 flex-grow leading-relaxed text-ink-soft">
                  {curso.description.length > 170
                    ? `${curso.description.slice(0, 170).trimEnd()}...`
                    : curso.description}
                </p>

                <div className="mt-8 flex items-end justify-between border-t border-blush-100 pt-6">
                  <div>
                    <p className="eyebrow text-blush-500">Investimento</p>
                    <p className="mt-1 font-display text-3xl text-ink">
                      {formatarPreco(curso.priceCents)}
                    </p>
                  </div>
                  <Link
                    to={`/curso/${curso.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-blush-600 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-blush-700"
                  >
                    Mais informações
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {previa && (
          <p className="mt-8 rounded-2xl border border-blush-200 bg-sand px-6 py-4 text-sm text-ink-soft">
            Prévia do conteúdo: a venda é liberada assim que o banco de dados e o pagamento
            estiverem configurados.
          </p>
        )}
      </div>
    </section>
  );
}

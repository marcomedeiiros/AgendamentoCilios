import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Monitor } from 'lucide-react';
import { api, formatarPreco, type Curso } from '../lib/api';

/**
 * Catálogo de cursos online vindo da API. A seção inteira some quando não há
 * curso publicado (ou a API está fora), para a página não exibir um vazio.
 */
export default function CursosOnline() {
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    api
      .cursos()
      .then(setCursos)
      .catch(() => setCursos([]));
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

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cursos.map((curso) => (
            <article
              key={curso.slug}
              className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-blush-100 bg-cream transition-shadow duration-300 hover:shadow-xl hover:shadow-blush-100"
            >
              {curso.coverImage && (
                <div className="h-44 overflow-hidden bg-sand">
                  <img
                    src={curso.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="flex flex-grow flex-col p-8">
                <span className="inline-flex w-max items-center gap-2 rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-blush-700">
                  <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                  {curso.totalAulas} aulas online
                </span>

                <h3 className="mt-4 font-display text-2xl text-ink">{curso.title}</h3>
                {curso.subtitle && <p className="mt-2 text-sm text-ink-soft">{curso.subtitle}</p>}
                <p className="mt-4 flex-grow leading-relaxed text-ink-soft">
                  {curso.description.length > 160
                    ? `${curso.description.slice(0, 160).trimEnd()}...`
                    : curso.description}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-blush-100 pt-6">
                  <span className="font-display text-3xl text-blush-700">
                    {formatarPreco(curso.priceCents)}
                  </span>
                  <Link
                    to={`/curso/${curso.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blush-600 transition-colors hover:text-blush-700"
                  >
                    Ver curso
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

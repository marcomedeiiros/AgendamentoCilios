import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { signOut, useSession } from '../lib/auth';
import { api, type Matricula } from '../lib/api';
import { usePageMeta } from '../hooks/usePageMeta';
import TrocarSenha from '../components/TrocarSenha';

export default function MinhaConta() {
  usePageMeta('Minha conta | Alicia Lash Designer');

  const { data: sessao, isPending } = useSession();
  const navegar = useNavigate();
  const [matriculas, setMatriculas] = useState<Matricula[] | null>(null);

  useEffect(() => {
    if (!isPending && !sessao?.user) {
      navegar('/entrar?voltarPara=/minha-conta', { replace: true });
    }
  }, [isPending, sessao, navegar]);

  useEffect(() => {
    if (!sessao?.user) return;
    api
      .minhasMatriculas()
      .then(setMatriculas)
      .catch(() => setMatriculas([]));
  }, [sessao]);

  if (!sessao?.user) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-blush-600">Área da aluna</p>
            <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              Olá, {sessao.user.name?.split(' ')[0]}
            </h1>
            <p className="mt-2 text-ink-soft">{sessao.user.email}</p>
            <TrocarSenha />
          </div>

          <button
            type="button"
            onClick={() => signOut().then(() => navegar('/'))}
            className="self-start rounded-full border border-blush-200 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blush-400"
          >
            Sair
          </button>
        </div>

        <h2 className="mt-14 font-display text-2xl text-ink">Meus cursos</h2>

        {matriculas === null ? (
          <p className="mt-6 text-ink-soft">Carregando...</p>
        ) : matriculas.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-blush-100 bg-sand p-8">
            <p className="leading-relaxed text-ink-soft">
              Você ainda não comprou nenhum curso.
            </p>
            <Link
              to="/cursos"
              className="mt-6 inline-flex rounded-full bg-blush-600 px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700"
            >
              Ver os cursos
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {matriculas.map((m) => (
              <Link
                key={m.slug}
                to={`/aluna/${m.slug}`}
                className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-blush-100 bg-cream transition-shadow hover:shadow-xl hover:shadow-blush-100"
              >
                {m.coverImage && (
                  <div className="h-40 overflow-hidden bg-sand">
                    <img
                      src={m.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-grow flex-col p-6">
                  <h3 className="font-display text-xl text-ink">{m.title}</h3>
                  {m.subtitle && <p className="mt-2 text-sm text-ink-soft">{m.subtitle}</p>}
                  <p className="mt-4 flex-grow text-sm text-ink-soft">{m.totalAulas} aulas</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-semibold text-blush-600">
                    <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    Assistir
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock, PlayCircle } from 'lucide-react';
import { api, ErroApi, formatarDuracao, formatarPreco, type CursoDetalhe } from '../lib/api';
import { useSession } from '../lib/auth';
import { usePageMeta } from '../hooks/usePageMeta';

export default function CursoOnline() {
  const { slug = '' } = useParams();
  const navegar = useNavigate();
  const { data: sessao } = useSession();

  const [curso, setCurso] = useState<CursoDetalhe | null>(null);
  const [aulaAtual, setAulaAtual] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [comprando, setComprando] = useState(false);

  usePageMeta(curso ? `${curso.title} | Alicia Lash Designer` : 'Curso | Alicia Lash Designer');

  useEffect(() => {
    api
      .curso(slug)
      .then((dados) => {
        setCurso(dados);
        const primeira = dados.aulas.find((a) => a.liberada && a.temVideo);
        setAulaAtual(primeira?.id ?? null);
      })
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Curso indisponível.'));
  }, [slug, sessao]);

  async function comprar() {
    if (!sessao?.user) {
      navegar(`/entrar?voltarPara=/curso/${slug}`);
      return;
    }

    setComprando(true);
    setErro(null);

    try {
      const { urlCheckout } = await api.comprar(slug);
      // Sai do site para o checkout do Mercado Pago; o cartão nunca passa aqui.
      window.location.href = urlCheckout;
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Não foi possível iniciar a compra.');
      setComprando(false);
    }
  }

  if (erro && !curso) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
          <h1 className="font-display text-3xl text-ink">{erro}</h1>
          <Link
            to="/cursos"
            className="mt-8 inline-flex rounded-full bg-blush-600 px-7 py-3.5 font-semibold text-cream"
          >
            Ver todos os cursos
          </Link>
        </div>
      </section>
    );
  }

  if (!curso) {
    return <section className="py-24 text-center text-ink-soft">Carregando...</section>;
  }

  const aula = curso.aulas.find((a) => a.id === aulaAtual) ?? null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="eyebrow text-blush-600">Curso online</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl text-ink md:text-5xl">{curso.title}</h1>
        {curso.subtitle && <p className="mt-3 text-lg text-ink-soft">{curso.subtitle}</p>}

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {aula ? (
              <>
                <div className="overflow-hidden rounded-[1.75rem] border border-blush-100 bg-blush-900">
                  <video
                    key={aula.id}
                    src={`/api/aulas/${aula.id}/video`}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="aspect-video w-full"
                  />
                </div>
                <h2 className="mt-6 font-display text-2xl text-ink">{aula.title}</h2>
                {aula.description && (
                  <p className="mt-2 leading-relaxed text-ink-soft">{aula.description}</p>
                )}
              </>
            ) : (
              <div className="overflow-hidden rounded-[1.75rem] border border-blush-100 bg-sand">
                {curso.coverImage ? (
                  <img src={curso.coverImage} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="aspect-video" />
                )}
              </div>
            )}

            <div className="mt-10 rounded-[1.75rem] border border-blush-100 bg-cream p-8">
              <h2 className="font-display text-2xl text-ink">Sobre o curso</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
                {curso.description}
              </p>
            </div>
          </div>

          <aside className="lg:col-span-1">
            {!curso.matriculada && (
              <div className="rounded-[1.75rem] border border-blush-200 bg-sand p-8">
                <p className="eyebrow text-blush-600">Investimento</p>
                <p className="mt-2 font-display text-4xl text-ink">
                  {formatarPreco(curso.priceCents)}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Acesso imediato depois da confirmação do pagamento.
                </p>

                {erro && (
                  <p role="alert" className="mt-5 text-sm text-blush-800">
                    {erro}
                  </p>
                )}

                <button
                  type="button"
                  onClick={comprar}
                  disabled={comprando}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush-600 px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700 disabled:opacity-60"
                >
                  {comprando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {comprando ? 'Abrindo pagamento...' : 'Comprar curso'}
                </button>

                <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft">
                  Pagamento pelo Mercado Pago, com PIX, cartão ou boleto.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-[1.75rem] border border-blush-100 bg-cream p-6">
              <h2 className="px-2 font-display text-xl text-ink">
                Aulas <span className="text-ink-soft">({curso.aulas.length})</span>
              </h2>

              <ul className="mt-4 space-y-1">
                {curso.aulas.map((a) => {
                  const disponivel = a.liberada && a.temVideo;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        disabled={!disponivel}
                        onClick={() => setAulaAtual(a.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                          a.id === aulaAtual ? 'bg-blush-50' : 'hover:bg-sand'
                        } ${disponivel ? '' : 'cursor-default opacity-60'}`}
                      >
                        {disponivel ? (
                          <PlayCircle className="h-5 w-5 shrink-0 text-blush-600" aria-hidden="true" />
                        ) : (
                          <Lock className="h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
                        )}
                        <span className="flex-grow">
                          <span className="block text-sm font-medium text-ink">{a.title}</span>
                          <span className="text-xs text-ink-soft">
                            {formatarDuracao(a.durationSeconds) ??
                              (a.gratuita ? 'Amostra gratuita' : 'Aula do curso')}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

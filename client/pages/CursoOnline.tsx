import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  Monitor,
  PlayCircle,
  Users,
} from 'lucide-react';
import { api, ErroApi, formatarDuracao, formatarPreco, type CursoDetalhe } from '../lib/api';
import { useSession } from '../lib/auth';
import { cursosExemplo } from '../data/cursosExemplo';
import { usePageMeta } from '../hooks/usePageMeta';

export default function CursoOnline() {
  const { slug = '' } = useParams();
  const navegar = useNavigate();
  const { data: sessao } = useSession();

  const [curso, setCurso] = useState<CursoDetalhe | null>(null);
  const [previa, setPrevia] = useState(false);
  const [aulaAtual, setAulaAtual] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [comprando, setComprando] = useState(false);

  usePageMeta(curso ? `${curso.title} | Alicia Lash Designer` : 'Curso | Alicia Lash Designer');

  useEffect(() => {
    let ativo = true;

    api
      .curso(slug)
      .then((dados) => {
        if (!ativo) return;
        setCurso(dados);
        setPrevia(false);
        setAulaAtual(dados.aulas.find((a) => a.liberada && a.temVideo)?.id ?? null);
      })
      .catch(() => {
        if (!ativo) return;
        // Banco fora do ar: mostra o conteúdo de vitrine, sem compra.
        const exemplo = cursosExemplo.find((c) => c.slug === slug);
        if (exemplo) {
          setCurso(exemplo);
          setPrevia(true);
        } else {
          setNaoEncontrado(true);
        }
      });

    return () => {
      ativo = false;
    };
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

  if (naoEncontrado) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
          <h1 className="font-display text-3xl text-ink">Curso não encontrado</h1>
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
  const podeComprar = !previa && !curso.matriculada;

  return (
    <>
      {/* Capa */}
      <section className="border-b border-blush-100 bg-sand py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blush-600 transition-colors hover:text-blush-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Todos os cursos
          </Link>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="eyebrow text-blush-600">Curso online</p>
              <h1 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
                {curso.title}
              </h1>
              {curso.subtitle && <p className="mt-4 text-lg text-ink-soft">{curso.subtitle}</p>}

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-blush-200 bg-cream px-4 py-2 text-sm font-medium text-ink">
                  <Monitor className="h-4 w-4 text-blush-500" aria-hidden="true" />
                  {curso.aulas.length} aulas gravadas
                </span>
                {curso.durationHours && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blush-200 bg-cream px-4 py-2 text-sm font-medium text-ink">
                    <Clock3 className="h-4 w-4 text-blush-500" aria-hidden="true" />
                    {curso.durationHours}h de conteúdo
                  </span>
                )}
                {curso.level && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blush-200 bg-cream px-4 py-2 text-sm font-medium text-ink">
                    <Users className="h-4 w-4 text-blush-500" aria-hidden="true" />
                    {curso.level}
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-blush-100 bg-cream">
              {aula && curso.matriculada ? (
                <video
                  key={aula.id}
                  src={`/api/aulas/${aula.id}/video`}
                  controls
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  className="aspect-video w-full bg-blush-900"
                />
              ) : curso.coverImage ? (
                <img src={curso.coverImage} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video bg-sand" />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <div>
              <h2 className="font-display text-3xl text-ink">Sobre o curso</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
                {curso.description}
              </p>
            </div>

            {curso.forWho && (
              <div>
                <h2 className="font-display text-3xl text-ink">Para quem é</h2>
                <p className="mt-4 leading-relaxed text-ink-soft">{curso.forWho}</p>
              </div>
            )}

            <div>
              <h2 className="font-display text-3xl text-ink">Conteúdo do curso</h2>
              <p className="mt-2 text-ink-soft">
                {curso.aulas.length} aulas
                {curso.matriculada ? '' : ' — as gratuitas você já pode assistir'}
              </p>

              <ol className="mt-6 divide-y divide-blush-100 overflow-hidden rounded-[1.5rem] border border-blush-100 bg-cream">
                {curso.aulas.map((a) => {
                  const disponivel = a.liberada && a.temVideo;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        disabled={!disponivel}
                        onClick={() => setAulaAtual(a.id)}
                        className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors ${
                          a.id === aulaAtual ? 'bg-blush-50' : 'hover:bg-sand'
                        } ${disponivel ? '' : 'cursor-default'}`}
                      >
                        <span className="w-6 shrink-0 text-sm font-semibold text-blush-400">
                          {a.position}
                        </span>
                        {disponivel ? (
                          <PlayCircle className="h-5 w-5 shrink-0 text-blush-600" aria-hidden="true" />
                        ) : (
                          <Lock className="h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
                        )}
                        <span className="flex-grow">
                          <span className="block font-medium text-ink">{a.title}</span>
                          {a.description && (
                            <span className="mt-0.5 block text-sm text-ink-soft">
                              {a.description}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-blush-500">
                          {a.gratuita && !curso.matriculada
                            ? 'Grátis'
                            : (formatarDuracao(a.durationSeconds) ?? '')}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Compra */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 rounded-[1.75rem] border border-blush-200 bg-sand p-8">
              {curso.matriculada ? (
                <>
                  <p className="inline-flex items-center gap-2 font-semibold text-blush-700">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    Curso liberado
                  </p>
                  <p className="mt-3 leading-relaxed text-ink-soft">
                    Escolha uma aula na lista ao lado para assistir.
                  </p>
                  <Link
                    to="/minha-conta"
                    className="mt-6 inline-flex w-full justify-center rounded-full border border-blush-300 bg-cream px-7 py-3.5 font-semibold text-ink transition-colors hover:border-blush-500"
                  >
                    Meus cursos
                  </Link>
                </>
              ) : (
                <>
                  <p className="eyebrow text-blush-600">Investimento</p>
                  <p className="mt-2 font-display text-4xl text-ink">
                    {formatarPreco(curso.priceCents)}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Acesso imediato depois da confirmação do pagamento.
                  </p>

                  {curso.includes.length > 0 && (
                    <ul className="mt-6 space-y-3 border-t border-blush-200 pt-6">
                      {curso.includes.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-ink">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-blush-500"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {erro && (
                    <p role="alert" className="mt-5 text-sm font-medium text-blush-800">
                      {erro}
                    </p>
                  )}

                  {podeComprar ? (
                    <button
                      type="button"
                      onClick={comprar}
                      disabled={comprando}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush-600 px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700 disabled:opacity-60"
                    >
                      {comprando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {comprando ? 'Abrindo pagamento...' : 'Comprar curso'}
                    </button>
                  ) : (
                    <p className="mt-6 rounded-2xl border border-blush-200 bg-cream px-5 py-4 text-sm leading-relaxed text-ink-soft">
                      A compra será liberada assim que o pagamento estiver configurado. Fale com o
                      studio pelo WhatsApp para garantir sua vaga.
                    </p>
                  )}

                  <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft">
                    Pagamento pelo Mercado Pago, com PIX, cartão ou boleto.
                  </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

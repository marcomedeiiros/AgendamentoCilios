import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, RefreshCw, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useConteudo } from '../hooks/useConteudo';
import Depoimentos from '../components/Depoimentos';
import { usePageMeta } from '../hooks/usePageMeta';

const diferenciais = [
  {
    icone: ShieldCheck,
    titulo: 'Biossegurança em primeiro lugar',
    texto:
      'Material esterilizado, descartáveis individuais e protocolo de higiene documentado a cada atendimento.',
  },
  {
    icone: Sparkles,
    titulo: 'Mapeamento personalizado',
    texto:
      'O desenho é definido a partir do formato dos olhos, da saúde do fio natural e da sua rotina, nunca de um modelo pronto.',
  },
  {
    icone: RefreshCw,
    titulo: 'Acompanhamento pós-procedimento',
    texto:
      'Orientações de cuidado por escrito e retorno para ajuste em até 7 dias, sem custo adicional.',
  },
];

export default function Home() {
  const { site, fotos, numeros, servicos } = useConteudo();

  usePageMeta(
    'Alicia Lash Designer | Extensão de cílios e formação profissional',
    'Studio especializado em extensão de cílios, volume russo e lash lifting em Piúma, no Espírito Santo. Agende sua avaliação.',
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-blush-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-sand blur-3xl" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 md:grid-cols-2 md:pb-28 md:pt-20">
          <div>
            <p className="eyebrow text-blush-600">Design de olhar desde 2018</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink md:text-6xl lg:text-7xl">
              Um olhar bem desenhado <em className="not-italic text-blush-600">começa na avaliação</em>.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Extensão de cílios, volume russo e lash lifting com técnica, higiene rigorosa e
              acabamento proporcional ao seu rosto. Cada procedimento começa com uma análise do fio
              natural e do formato dos seus olhos.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/agendamento"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blush-600 px-8 py-4 font-semibold text-cream shadow-sm transition-colors hover:bg-blush-700"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
                Agendar avaliação
              </Link>
              <Link
                to="/cursos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-blush-200 bg-cream px-8 py-4 font-semibold text-ink transition-colors hover:border-blush-400"
              >
                Conhecer a formação
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-6 text-sm text-ink-soft">
              {site.hours} · {site.address}
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-blush-100 bg-sand shadow-xl shadow-blush-200/40">
              <img
                src={fotos.hero}
                alt="Close-up de um olhar com extensão de cílios aplicada"
                width={1000}
                height={1250}
                className="h-[420px] w-full object-cover md:h-[560px]"
              />
            </div>

            <div className="absolute -left-3 bottom-8 flex items-center gap-3 rounded-2xl border border-blush-100 bg-cream px-5 py-4 shadow-lg shadow-blush-200/50 md:-left-8">
              <Star className="h-6 w-6 fill-gold text-gold" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink">4,9 de 5</p>
                <p className="text-xs text-ink-soft">312 avaliações de clientes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="border-y border-blush-100 bg-sand" aria-label="O studio em números">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 sm:px-8 md:grid-cols-4">
          {numeros.map((n) => (
            <div key={n.rotulo} className="flex flex-col-reverse">
              <dt className="mt-1 text-sm text-ink-soft">{n.rotulo}</dt>
              <dd className="font-display text-4xl text-blush-700">{n.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Serviços */}
      <section id="servicos" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow text-blush-600">Serviços</p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">Procedimentos e valores</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Os valores abaixo são para aplicação completa. A manutenção é cobrada à parte e
              depende do tempo desde o último atendimento.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {servicos.map((s) => (
              <article
                key={s.slug}
                className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-blush-100 bg-cream transition-shadow duration-300 hover:shadow-xl hover:shadow-blush-100"
              >
                <div className="h-48 overflow-hidden bg-sand">
                  <img
                    src={s.imagem}
                    alt={s.imagemAlt}
                    width={700}
                    height={420}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-grow flex-col p-8">
                  <h3 className="font-display text-2xl text-ink">{s.titulo}</h3>
                  <p className="mt-4 flex-grow leading-relaxed text-ink-soft">{s.descricao}</p>

                  <ul className="mt-6 space-y-2 text-sm text-ink-soft">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blush-400" aria-hidden="true" />
                      Duração aproximada de {s.duracao}
                    </li>
                    <li className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blush-400" aria-hidden="true" />
                      Manutenção {s.manutencao}
                    </li>
                  </ul>

                  <div className="mt-8 flex items-center justify-between border-t border-blush-100 pt-6">
                    <span className="font-display text-3xl text-blush-700">{s.preco}</span>
                    <Link
                      to="/agendamento"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blush-600 transition-colors hover:text-blush-700"
                    >
                      Agendar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="scroll-mt-24 border-y border-blush-100 bg-sand py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 md:grid-cols-2 md:items-center">
          <div className="overflow-hidden rounded-[2rem] border border-blush-100">
            <img
              src={fotos.studio}
              alt="Ambiente do studio preparado para atendimento"
              width={1000}
              height={800}
              loading="lazy"
              className="h-[380px] w-full object-cover md:h-[480px]"
            />
          </div>

          <div>
            <p className="eyebrow text-blush-600">O studio</p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              Técnica, higiene e acompanhamento
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Atendemos uma cliente por vez, com horário reservado e tempo suficiente para fazer o
              procedimento sem pressa. O resultado é pensado para durar e para preservar a saúde do
              fio natural.
            </p>

            <ul className="mt-10 space-y-8">
              {diferenciais.map(({ icone: Icone, titulo, texto }) => (
                <li key={titulo} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-100 text-blush-700">
                    <Icone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{titulo}</h3>
                    <p className="mt-1 leading-relaxed text-ink-soft">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Depoimentos />

      {/* Chamada final */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="rounded-[2rem] bg-blush-800 px-8 py-14 text-center md:px-16 md:py-20">
            <h2 className="mx-auto max-w-2xl font-display text-4xl text-cream md:text-5xl">
              Vamos desenhar o seu olhar?
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-blush-100/85">
              Solicite um horário e retornamos pelo WhatsApp em até 24 horas úteis para confirmar a
              data e tirar suas dúvidas.
            </p>
            <Link
              to="/agendamento"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-cream px-8 py-4 font-semibold text-ink transition-colors hover:bg-blush-100"
            >
              <Calendar className="h-5 w-5" aria-hidden="true" />
              Agendar avaliação
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

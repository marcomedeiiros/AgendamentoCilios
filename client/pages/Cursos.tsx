import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Clock3, Users } from 'lucide-react';
import { cursos } from '../data/site';
import { usePageMeta } from '../hooks/usePageMeta';

const garantias = [
  { icone: Award, texto: 'Certificado com carga horária' },
  { icone: Users, texto: 'Turmas reduzidas, com prática supervisionada' },
  { icone: Clock3, texto: 'Material de apoio com acesso vitalício' },
];

export default function Cursos() {
  usePageMeta(
    'Formação profissional | Alicia Lash Designer',
    'Cursos certificados de extensão de cílios: formação completa e masterclass de volume russo, com turmas reduzidas.',
  );

  return (
    <>
      {/* Cabeçalho */}
      <section className="border-b border-blush-100 bg-sand">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow text-blush-600">Formação profissional</p>
            <h1 className="mt-5 font-display text-4xl leading-tight text-ink md:text-6xl">
              Aprenda a técnica e a gestão por trás de um studio.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Nossos cursos vão além da aplicação: biossegurança, atendimento, precificação e
              retenção de clientes. Formamos profissionais prontas para atender com autonomia.
            </p>

            <ul className="mt-10 space-y-3">
              {garantias.map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-center gap-3 text-ink">
                  <Icone className="h-5 w-5 shrink-0 text-blush-500" aria-hidden="true" />
                  <span className="font-medium">{texto}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <div className="overflow-hidden rounded-[2rem] border border-blush-100">
              <img
                src="https://images.unsplash.com/photo-1574015974293-817f0ebebb74?auto=format&fit=crop&q=80&w=800"
                alt="Aluna praticando aplicação de extensão de cílios durante o curso"
                width={800}
                height={640}
                className="h-[460px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cursos */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow text-blush-600">Turmas abertas</p>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">Escolha a sua formação</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              As vagas são limitadas pelo número de bancadas do studio. A matrícula é confirmada
              após a conversa inicial com a equipe.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {cursos.map((curso) => (
              <article
                key={curso.id}
                className={`flex flex-col overflow-hidden rounded-[2rem] border bg-cream ${
                  curso.destaque ? 'border-blush-300 shadow-xl shadow-blush-100' : 'border-blush-100'
                }`}
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={curso.imagem}
                    alt={curso.titulo}
                    width={800}
                    height={480}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {curso.destaque && (
                    <span className="absolute right-5 top-5 rounded-full bg-cream px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blush-700">
                      Mais procurado
                    </span>
                  )}
                </div>

                <div className="flex flex-grow flex-col p-8 md:p-10">
                  <h3 className="font-display text-2xl leading-snug text-ink">{curso.titulo}</h3>

                  <p className="mt-3 text-sm font-medium text-blush-600">
                    {curso.cargaHoraria} · {curso.formato}
                  </p>

                  <p className="mt-4 flex-grow leading-relaxed text-ink-soft">{curso.descricao}</p>

                  <ul className="mt-8 space-y-3 rounded-2xl bg-sand p-6">
                    {curso.inclui.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-ink">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-blush-500"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-col gap-5 border-t border-blush-100 pt-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="eyebrow text-blush-500">Investimento</p>
                      <p className="mt-2 font-display text-3xl text-ink">{curso.preco}</p>
                      <p className="mt-1 text-sm text-ink-soft">{curso.parcelas}</p>
                    </div>
                    <Link
                      to="/agendamento"
                      className="rounded-full bg-blush-600 px-7 py-3.5 text-center font-semibold text-cream transition-colors hover:bg-blush-700"
                    >
                      Falar sobre a turma
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-10 text-sm text-ink-soft">
            Precisa de um conteúdo específico para a sua equipe?{' '}
            <Link to="/#contato" className="font-semibold text-blush-600 hover:text-blush-700">
              Fale com o studio
            </Link>{' '}
            sobre turmas fechadas.
          </p>
        </div>
      </section>
    </>
  );
}

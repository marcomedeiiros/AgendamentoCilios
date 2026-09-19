import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Phone, ShieldCheck, User } from 'lucide-react';
import { fotos, servicos, site } from '../data/site';
import { usePageMeta } from '../hooks/usePageMeta';

type Formulario = {
  servico: string;
  data: string;
  horario: string;
  nome: string;
  telefone: string;
  observacoes: string;
};

const vazio: Formulario = {
  servico: '',
  data: '',
  horario: '',
  nome: '',
  telefone: '',
  observacoes: '',
};

const campoBase =
  'w-full rounded-2xl border border-blush-200 bg-cream px-4 py-3.5 text-ink transition-colors placeholder:text-blush-300 focus:border-blush-500 focus:bg-white focus:outline-none';

const hoje = new Date().toISOString().slice(0, 10);

export default function Agendamento() {
  usePageMeta(
    'Agendar horário | Lash&Co Studio',
    'Solicite seu horário para extensão de cílios, volume russo ou lash lifting no Lash&Co Studio.',
  );

  const [dados, setDados] = useState<Formulario>(vazio);
  const [enviado, setEnviado] = useState(false);

  const atualizar =
    (campo: keyof Formulario) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDados((atual) => ({ ...atual, [campo]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A integração com a API (/api/agendamentos) entra aqui.
    setEnviado(true);
  };

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-blush-100 bg-cream shadow-xl shadow-blush-100/60 md:grid md:grid-cols-12">
          {/* Coluna informativa */}
          <aside className="relative flex min-h-[260px] flex-col justify-end bg-blush-800 p-8 md:col-span-5 md:min-h-[640px] md:p-12">
            <img
              src={fotos.agendamento}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blush-900 via-blush-900/70 to-blush-900/20" />

            <div className="relative">
              <p className="eyebrow text-blush-300">Agendamento</p>
              <h1 className="mt-4 font-display text-4xl leading-tight text-cream md:text-5xl">
                Reserve o seu horário
              </h1>
              <p className="mt-4 max-w-sm leading-relaxed text-blush-100/85">
                Envie sua preferência de data e horário. Confirmamos a disponibilidade pelo WhatsApp
                em até 24 horas úteis.
              </p>

              <dl className="mt-10 space-y-4 border-t border-blush-700/60 pt-8 text-sm text-blush-100/85">
                <div className="flex gap-3">
                  <dt className="sr-only">Horário de funcionamento</dt>
                  <Clock className="h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
                  <dd>{site.hours}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="sr-only">Avaliação</dt>
                  <ShieldCheck className="h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
                  <dd>Avaliação inclusa, sem custo, antes do procedimento</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="sr-only">Telefone</dt>
                  <Phone className="h-5 w-5 shrink-0 text-blush-300" aria-hidden="true" />
                  <dd>{site.phone}</dd>
                </div>
              </dl>
            </div>
          </aside>

          {/* Formulário */}
          <div className="p-8 md:col-span-7 md:p-12 lg:p-16">
            {enviado ? (
              <div className="flex h-full flex-col justify-center py-10 text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush-100 text-blush-700">
                  <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
                </span>
                <h2 className="mt-8 font-display text-3xl text-ink">Solicitação enviada</h2>
                <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
                  Recebemos seu pedido de horário. Nossa equipe entra em contato pelo WhatsApp{' '}
                  <strong className="font-semibold text-ink">{dados.telefone || site.phone}</strong>{' '}
                  para confirmar a data.
                </p>

                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setDados(vazio);
                      setEnviado(false);
                    }}
                    className="rounded-full bg-blush-600 px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700"
                  >
                    Fazer novo agendamento
                  </button>
                  <Link
                    to="/"
                    className="rounded-full border border-blush-200 px-7 py-3.5 font-semibold text-ink transition-colors hover:border-blush-400"
                  >
                    Voltar ao início
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-3xl text-ink">Dados do atendimento</h2>
                <p className="mt-2 text-ink-soft">
                  Campos marcados com <span aria-hidden="true">*</span> são obrigatórios.
                </p>

                <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate={false}>
                  <div>
                    <label htmlFor="servico" className="mb-2 block text-sm font-semibold text-ink">
                      Procedimento *
                    </label>
                    <select
                      id="servico"
                      name="servico"
                      required
                      value={dados.servico}
                      onChange={atualizar('servico')}
                      className={`${campoBase} cursor-pointer`}
                    >
                      <option value="" disabled>
                        Selecione o procedimento
                      </option>
                      {servicos.map((s) => (
                        <option key={s.slug} value={s.titulo}>
                          {s.titulo} - {s.preco}
                        </option>
                      ))}
                      <option value="Manutenção">Manutenção de extensão existente</option>
                      <option value="Avaliação">Ainda não sei, quero uma avaliação</option>
                    </select>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="data" className="mb-2 block text-sm font-semibold text-ink">
                        Data preferida *
                      </label>
                      <div className="relative">
                        <CalendarDays
                          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blush-400"
                          aria-hidden="true"
                        />
                        <input
                          id="data"
                          name="data"
                          type="date"
                          required
                          min={hoje}
                          value={dados.data}
                          onChange={atualizar('data')}
                          className={`${campoBase} pl-12`}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="horario" className="mb-2 block text-sm font-semibold text-ink">
                        Horário preferido *
                      </label>
                      <div className="relative">
                        <Clock
                          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blush-400"
                          aria-hidden="true"
                        />
                        <input
                          id="horario"
                          name="horario"
                          type="time"
                          required
                          min="09:00"
                          max="19:00"
                          value={dados.horario}
                          onChange={atualizar('horario')}
                          className={`${campoBase} pl-12`}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ink-soft">Atendimento das 9h às 19h.</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="nome" className="mb-2 block text-sm font-semibold text-ink">
                      Nome completo *
                    </label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blush-400"
                        aria-hidden="true"
                      />
                      <input
                        id="nome"
                        name="nome"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Seu nome e sobrenome"
                        value={dados.nome}
                        onChange={atualizar('nome')}
                        className={`${campoBase} pl-12`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="telefone" className="mb-2 block text-sm font-semibold text-ink">
                      WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blush-400"
                        aria-hidden="true"
                      />
                      <input
                        id="telefone"
                        name="telefone"
                        type="tel"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(11) 90000-0000"
                        value={dados.telefone}
                        onChange={atualizar('telefone')}
                        className={`${campoBase} pl-12`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="observacoes" className="mb-2 block text-sm font-semibold text-ink">
                      Observações
                    </label>
                    <textarea
                      id="observacoes"
                      name="observacoes"
                      rows={3}
                      placeholder="Alergias, procedimentos anteriores ou alguma preferência de desenho."
                      value={dados.observacoes}
                      onChange={atualizar('observacoes')}
                      className={`${campoBase} resize-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-blush-600 px-8 py-4 font-semibold text-cream transition-colors hover:bg-blush-700"
                  >
                    Solicitar agendamento
                  </button>

                  <p className="text-center text-xs leading-relaxed text-ink-soft">
                    Ao enviar, você autoriza o contato do studio pelos dados informados. O horário só
                    é considerado reservado após a nossa confirmação.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

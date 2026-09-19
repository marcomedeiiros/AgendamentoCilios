import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { signIn, signUp, useSession } from '../lib/auth';
import { usePageMeta } from '../hooks/usePageMeta';

const campoBase =
  'w-full rounded-2xl border border-blush-200 bg-cream px-4 py-3.5 text-ink transition-colors placeholder:text-blush-300 focus:border-blush-500 focus:bg-white focus:outline-none';

export default function Entrar() {
  usePageMeta('Entrar | Alicia Lash Designer');

  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { data: sessao } = useSession();

  const [modo, setModo] = useState<'entrar' | 'criar'>(
    params.get('modo') === 'criar' ? 'criar' : 'entrar',
  );
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Para onde ir depois de entrar: a página que pediu login, ou minha conta.
  const destino = params.get('voltarPara') ?? '/minha-conta';

  if (sessao?.user) {
    navegar(destino, { replace: true });
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const resultado =
      modo === 'criar'
        ? await signUp.email({ name: nome, email, password: senha })
        : await signIn.email({ email, password: senha });

    setEnviando(false);

    if (resultado.error) {
      setErro(
        resultado.error.message ??
          (modo === 'criar'
            ? 'Não foi possível criar a conta.'
            : 'E-mail ou senha incorretos.'),
      );
      return;
    }

    navegar(destino, { replace: true });
  }

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-md px-5 sm:px-8">
        <div className="rounded-[2rem] border border-blush-100 bg-cream p-8 md:p-10">
          <p className="eyebrow text-blush-600">Área da aluna</p>
          <h1 className="mt-4 font-display text-3xl text-ink">
            {modo === 'criar' ? 'Criar minha conta' : 'Entrar'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {modo === 'criar'
              ? 'A conta guarda os cursos que você comprar.'
              : 'Acesse os cursos que você já comprou.'}
          </p>

          {erro && (
            <p
              role="alert"
              className="mt-6 rounded-2xl border border-blush-300 bg-blush-50 px-5 py-4 text-sm text-blush-800"
            >
              {erro}
            </p>
          )}

          <form onSubmit={enviar} className="mt-8 space-y-5">
            {modo === 'criar' && (
              <div>
                <label htmlFor="nome" className="mb-2 block text-sm font-semibold text-ink">
                  Nome completo
                </label>
                <input
                  id="nome"
                  required
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={campoBase}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campoBase}
              />
            </div>

            <div>
              <label htmlFor="senha" className="mb-2 block text-sm font-semibold text-ink">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={8}
                autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={campoBase}
              />
              {modo === 'criar' && (
                <p className="mt-2 text-xs text-ink-soft">No mínimo 8 caracteres.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush-600 px-8 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700 disabled:opacity-60"
            >
              {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {modo === 'criar' ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {modo === 'criar' ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setModo(modo === 'criar' ? 'entrar' : 'criar');
                setErro(null);
              }}
              className="font-semibold text-blush-600 hover:text-blush-700"
            >
              {modo === 'criar' ? 'Entrar' : 'Criar agora'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link to="/cursos" className="font-semibold text-blush-600 hover:text-blush-700">
            Ver os cursos
          </Link>
        </p>
      </div>
    </section>
  );
}

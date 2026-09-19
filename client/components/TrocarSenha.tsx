import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '../lib/auth';

const campo =
  'w-full rounded-2xl border border-blush-200 bg-cream px-4 py-3 text-ink transition-colors focus:border-blush-500 focus:bg-white focus:outline-none';

export default function TrocarSenha() {
  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const resultado = await auth.changePassword({
      currentPassword: atual,
      newPassword: nova,
      // Derruba as outras sessões: se a senha antiga vazou, quem estava
      // logado com ela perde o acesso agora.
      revokeOtherSessions: true,
    });

    setEnviando(false);

    if (resultado.error) {
      setErro(resultado.error.message ?? 'Não foi possível trocar a senha.');
      return;
    }

    setAtual('');
    setNova('');
    setPronto(true);
    setAberto(false);
  }

  if (!aberto) {
    return (
      <div className="mt-6">
        {pronto && (
          <p role="status" className="mb-3 text-sm font-medium text-blush-700">
            Senha trocada. As outras sessões foram desconectadas.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setAberto(true);
            setPronto(false);
          }}
          className="text-sm font-semibold text-blush-600 transition-colors hover:text-blush-700"
        >
          Trocar minha senha
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-6 max-w-md space-y-4 rounded-[1.5rem] border border-blush-200 bg-sand p-6"
    >
      <h2 className="font-display text-xl text-ink">Trocar senha</h2>

      {erro && (
        <p role="alert" className="text-sm text-blush-800">
          {erro}
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">Senha atual</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          className={campo}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">Nova senha</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          className={campo}
        />
        <span className="mt-1 block text-xs text-ink-soft">No mínimo 8 caracteres.</span>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 rounded-full bg-blush-600 px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-blush-700 disabled:opacity-60"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Salvar senha
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-full border border-blush-200 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blush-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

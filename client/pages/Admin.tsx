import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, centavosParaReais, type PedidoAdmin } from '../lib/adminApi';
import { useSession } from '../lib/auth';
import { usePageMeta } from '../hooks/usePageMeta';
import PainelDepoimentos from '../admin/PainelDepoimentos';
import PainelServicos from '../admin/PainelServicos';
import PainelCursos from '../admin/PainelCursos';
import PainelSite from '../admin/PainelSite';

const abas = [
  { id: 'site', label: 'Conteúdo do site' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'cursos', label: 'Cursos' },
  { id: 'depoimentos', label: 'Depoimentos' },
  { id: 'vendas', label: 'Vendas' },
] as const;

type Aba = (typeof abas)[number]['id'];

export default function Admin() {
  usePageMeta('Painel | Alicia Lash Designer');

  const { data: sessao, isPending } = useSession();
  const navegar = useNavigate();
  const [aba, setAba] = useState<Aba>('site');

  const ehAdmin = (sessao?.user as { role?: string } | undefined)?.role === 'admin';

  useEffect(() => {
    if (!isPending && !sessao?.user) {
      navegar('/entrar?voltarPara=/admin', { replace: true });
    }
  }, [isPending, sessao, navegar]);

  if (isPending || !sessao?.user) return null;

  if (!ehAdmin) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-lg px-5 text-center sm:px-8">
          <h1 className="font-display text-3xl text-ink">Acesso restrito</h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Esta área é só da administração do studio.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="eyebrow text-blush-600">Painel</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Administração do site</h1>

        <nav className="mt-10 flex flex-wrap gap-2 border-b border-blush-100 pb-4">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                aba === a.id
                  ? 'bg-blush-600 text-cream'
                  : 'border border-blush-200 text-ink hover:border-blush-400'
              }`}
            >
              {a.label}
            </button>
          ))}
        </nav>

        <div className="mt-10">
          {aba === 'site' && <PainelSite />}
          {aba === 'servicos' && <PainelServicos />}
          {aba === 'cursos' && <PainelCursos />}
          {aba === 'depoimentos' && <PainelDepoimentos />}
          {aba === 'vendas' && <PainelVendas />}
        </div>
      </div>
    </section>
  );
}

const rotulosStatus: Record<PedidoAdmin['status'], string> = {
  PAID: 'Pago',
  PENDING: 'Aguardando',
  FAILED: 'Não concluído',
  REFUNDED: 'Estornado',
};

function PainelVendas() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[] | null>(null);

  useEffect(() => {
    adminApi
      .pedidos()
      .then(setPedidos)
      .catch(() => setPedidos([]));
  }, []);

  if (pedidos === null) return <p className="text-ink-soft">Carregando...</p>;
  if (pedidos.length === 0) return <p className="text-ink-soft">Nenhuma venda ainda.</p>;

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-blush-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand text-ink">
          <tr>
            <th className="px-5 py-4 font-semibold">Aluna</th>
            <th className="px-5 py-4 font-semibold">Curso</th>
            <th className="px-5 py-4 font-semibold">Valor</th>
            <th className="px-5 py-4 font-semibold">Situação</th>
            <th className="px-5 py-4 font-semibold">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blush-100 bg-cream">
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td className="px-5 py-4">
                <span className="block font-medium text-ink">{p.user.name}</span>
                <span className="text-ink-soft">{p.user.email}</span>
              </td>
              <td className="px-5 py-4 text-ink-soft">{p.course.title}</td>
              <td className="px-5 py-4 text-ink">R$ {centavosParaReais(p.amountCents)}</td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    p.status === 'PAID' ? 'bg-blush-100 text-blush-800' : 'bg-sand text-ink-soft'
                  }`}
                >
                  {rotulosStatus[p.status]}
                </span>
              </td>
              <td className="px-5 py-4 text-ink-soft">
                {new Date(p.paidAt ?? p.createdAt).toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

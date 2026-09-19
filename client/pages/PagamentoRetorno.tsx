import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { usePageMeta } from '../hooks/usePageMeta';

type Situacao = 'aguardando' | 'pago' | 'pendente' | 'falha';

export default function PagamentoRetorno() {
  usePageMeta('Pagamento | Alicia Lash Designer');

  const [params] = useSearchParams();
  const [situacao, setSituacao] = useState<Situacao>('aguardando');
  const [curso, setCurso] = useState<{ slug: string; title: string } | null>(null);
  const tentativas = useRef(0);

  // O external_reference volta como query na URL de retorno do Mercado Pago.
  const pedidoId = params.get('external_reference');
  const statusUrl = params.get('status');

  useEffect(() => {
    if (!pedidoId) {
      setSituacao(statusUrl === 'falha' ? 'falha' : 'pendente');
      return;
    }

    let ativo = true;

    // Quem confirma a compra é o webhook, que pode chegar depois do navegador.
    // Por isso consultamos o pedido algumas vezes antes de desistir.
    async function conferir() {
      try {
        const pedido = await api.pedido(pedidoId!);
        if (!ativo) return;

        setCurso(pedido.course);

        if (pedido.status === 'PAID') {
          setSituacao('pago');
          return;
        }
        if (pedido.status === 'FAILED') {
          setSituacao('falha');
          return;
        }

        tentativas.current += 1;
        if (tentativas.current > 10) {
          setSituacao('pendente');
          return;
        }
        setTimeout(conferir, 2000);
      } catch {
        if (ativo) setSituacao('pendente');
      }
    }

    conferir();
    return () => {
      ativo = false;
    };
  }, [pedidoId, statusUrl]);

  const conteudo = {
    aguardando: {
      Icone: Clock,
      titulo: 'Confirmando seu pagamento...',
      texto: 'Isso leva alguns segundos. Não feche esta página.',
    },
    pago: {
      Icone: CheckCircle2,
      titulo: 'Pagamento confirmado!',
      texto: 'Seu curso já está liberado na área da aluna.',
    },
    pendente: {
      Icone: Clock,
      titulo: 'Pagamento em processamento',
      texto:
        'PIX e boleto podem levar alguns minutos para compensar. Assim que cair, o curso aparece na sua conta — você não precisa pagar de novo.',
    },
    falha: {
      Icone: XCircle,
      titulo: 'O pagamento não foi concluído',
      texto: 'Nada foi cobrado. Você pode tentar novamente quando quiser.',
    },
  }[situacao];

  const { Icone } = conteudo;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-lg px-5 text-center sm:px-8">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush-100 text-blush-700">
          <Icone className="h-10 w-10" aria-hidden="true" />
        </span>

        <h1 className="mt-8 font-display text-3xl text-ink">{conteudo.titulo}</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">{conteudo.texto}</p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/minha-conta"
            className="rounded-full bg-blush-600 px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-blush-700"
          >
            Ir para meus cursos
          </Link>
          {curso && situacao === 'falha' && (
            <Link
              to={`/curso/${curso.slug}`}
              className="rounded-full border border-blush-200 px-7 py-3.5 font-semibold text-ink transition-colors hover:border-blush-400"
            >
              Tentar de novo
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { adminApi, type DepoimentoAdmin } from '../lib/adminApi';
import { Botao, Erros } from './componentes';

export default function PainelDepoimentos() {
  const [itens, setItens] = useState<DepoimentoAdmin[] | null>(null);
  const [erros, setErros] = useState<string[]>([]);

  function carregar() {
    adminApi
      .depoimentos()
      .then(setItens)
      .catch((e) => {
        setErros([(e as Error).message]);
        setItens([]);
      });
  }

  useEffect(carregar, []);

  async function alternar(item: DepoimentoAdmin) {
    await adminApi.aprovarDepoimento(item.id, !item.aprovado);
    carregar();
  }

  async function excluir(item: DepoimentoAdmin) {
    if (!confirm(`Excluir o depoimento de ${item.nome}? Isso não tem volta.`)) return;
    await adminApi.excluirDepoimento(item.id);
    carregar();
  }

  if (itens === null) return <p className="text-ink-soft">Carregando...</p>;

  const pendentes = itens.filter((i) => !i.aprovado);
  const publicados = itens.filter((i) => i.aprovado);

  return (
    <div className="space-y-10">
      <Erros erros={erros} />

      <section>
        <h2 className="font-display text-2xl text-ink">
          Aguardando conferência{' '}
          <span className="text-ink-soft">({pendentes.length})</span>
        </h2>
        {pendentes.length === 0 ? (
          <p className="mt-3 text-ink-soft">Nada pendente.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {pendentes.map((item) => (
              <Cartao key={item.id} item={item} aoAlternar={alternar} aoExcluir={excluir} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-ink">
          No site <span className="text-ink-soft">({publicados.length})</span>
        </h2>
        {publicados.length === 0 ? (
          <p className="mt-3 text-ink-soft">Nenhum depoimento publicado ainda.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {publicados.map((item) => (
              <Cartao key={item.id} item={item} aoAlternar={alternar} aoExcluir={excluir} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cartao({
  item,
  aoAlternar,
  aoExcluir,
}: {
  item: DepoimentoAdmin;
  aoAlternar: (i: DepoimentoAdmin) => void;
  aoExcluir: (i: DepoimentoAdmin) => void;
}) {
  return (
    <li className="rounded-[1.5rem] border border-blush-100 bg-cream p-6">
      <div className="flex flex-wrap items-start gap-4">
        {item.foto && (
          <img
            src={item.foto}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl border border-blush-100 object-cover"
          />
        )}

        <div className="min-w-[14rem] flex-grow">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{item.nome}</span>
            <span className="flex" aria-label={`${item.nota} de 5`}>
              {Array.from({ length: item.nota }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
              ))}
            </span>
          </div>
          <p className="text-sm text-ink-soft">
            {item.servico} · {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">{item.texto}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Botao
            variante={item.aprovado ? 'secundario' : 'primario'}
            onClick={() => aoAlternar(item)}
          >
            {item.aprovado ? 'Tirar do site' : 'Publicar'}
          </Botao>
          <Botao variante="perigo" onClick={() => aoExcluir(item)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir
          </Botao>
        </div>
      </div>
    </li>
  );
}

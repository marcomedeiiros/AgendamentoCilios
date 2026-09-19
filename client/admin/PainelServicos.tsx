import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  adminApi,
  centavosParaReais,
  reaisParaCentavos,
  type ServicoAdmin,
} from '../lib/adminApi';
import { Botao, Campo, EscolherImagem, Erros, campo } from './componentes';

type Rascunho = Partial<ServicoAdmin> & { precoTexto?: string };

const vazio: Rascunho = {
  name: '',
  description: '',
  durationMinutes: 120,
  maintenance: '',
  precoTexto: '0,00',
  imageUrl: null,
  active: true,
};

export default function PainelServicos() {
  const [itens, setItens] = useState<ServicoAdmin[] | null>(null);
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    adminApi
      .servicos()
      .then(setItens)
      .catch((e) => {
        setErros([(e as Error).message]);
        setItens([]);
      });
  }

  useEffect(carregar, []);

  async function salvar() {
    if (!editando) return;
    setErros([]);
    setSalvando(true);

    const dados = {
      ...editando,
      priceCents: reaisParaCentavos(editando.precoTexto ?? '0'),
      position: editando.position ?? (itens?.length ?? 0),
    };

    try {
      if (editando.id) await adminApi.salvarServico(editando.id, dados);
      else await adminApi.criarServico(dados);
      setEditando(null);
      carregar();
    } catch (e) {
      setErros((e as { erros?: string[] }).erros ?? [(e as Error).message]);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(item: ServicoAdmin) {
    if (!confirm(`Tirar "${item.name}" do site?`)) return;
    await adminApi.excluirServico(item.id);
    carregar();
  }

  if (itens === null) return <p className="text-ink-soft">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Serviços do site</h2>
        <Botao onClick={() => setEditando({ ...vazio })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo serviço
        </Botao>
      </div>

      <Erros erros={erros} />

      {editando && (
        <div className="space-y-5 rounded-[1.5rem] border border-blush-200 bg-sand p-6 md:p-8">
          <h3 className="font-display text-xl text-ink">
            {editando.id ? 'Editando serviço' : 'Novo serviço'}
          </h3>

          <div className="grid gap-5 md:grid-cols-2">
            <Campo label="Nome">
              <input
                className={campo}
                value={editando.name ?? ''}
                onChange={(e) => setEditando({ ...editando, name: e.target.value })}
              />
            </Campo>

            <Campo label="Preço (R$)">
              <input
                className={campo}
                value={editando.precoTexto ?? ''}
                onChange={(e) => setEditando({ ...editando, precoTexto: e.target.value })}
              />
            </Campo>

            <Campo label="Duração (minutos)">
              <input
                type="number"
                className={campo}
                value={editando.durationMinutes ?? 0}
                onChange={(e) =>
                  setEditando({ ...editando, durationMinutes: Number(e.target.value) })
                }
              />
            </Campo>

            <Campo label="Manutenção" dica='Ex.: "a cada 21 dias"'>
              <input
                className={campo}
                value={editando.maintenance ?? ''}
                onChange={(e) => setEditando({ ...editando, maintenance: e.target.value })}
              />
            </Campo>
          </div>

          <Campo label="Descrição">
            <textarea
              rows={3}
              className={`${campo} resize-none`}
              value={editando.description ?? ''}
              onChange={(e) => setEditando({ ...editando, description: e.target.value })}
            />
          </Campo>

          <Campo label="Foto do serviço">
            <EscolherImagem
              valor={editando.imageUrl ?? null}
              aoMudar={(url) => setEditando({ ...editando, imageUrl: url })}
            />
          </Campo>

          <div className="flex gap-3">
            <Botao onClick={salvar} carregando={salvando}>
              Salvar
            </Botao>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}

      {itens.length === 0 ? (
        <p className="text-ink-soft">
          Nenhum serviço cadastrado — o site está mostrando a lista padrão do código.
        </p>
      ) : (
        <ul className="space-y-4">
          {itens.map((item) => (
            <li
              key={item.id}
              className={`flex flex-wrap items-center gap-4 rounded-[1.5rem] border p-5 ${
                item.active ? 'border-blush-100 bg-cream' : 'border-blush-100 bg-sand opacity-60'
              }`}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-blush-100 object-cover"
                />
              )}

              <div className="min-w-[12rem] flex-grow">
                <p className="font-semibold text-ink">
                  {item.name} {!item.active && <span className="text-ink-soft">(fora do site)</span>}
                </p>
                <p className="text-sm text-ink-soft">
                  R$ {centavosParaReais(item.priceCents)} · {item.durationMinutes} min
                  {item.maintenance ? ` · ${item.maintenance}` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <Botao
                  variante="secundario"
                  onClick={() =>
                    setEditando({ ...item, precoTexto: centavosParaReais(item.priceCents) })
                  }
                >
                  Editar
                </Botao>
                {item.active && (
                  <Botao variante="perigo" onClick={() => excluir(item)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Botao>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

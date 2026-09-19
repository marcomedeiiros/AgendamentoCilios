import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { fotos, site, type Contato, type FotosSite } from '../data/site';
import { Botao, Campo, EscolherImagem, Erros, campo } from './componentes';

type Fotos = FotosSite;
type Numero = { valor: string; rotulo: string };

const numerosPadrao: Numero[] = [
  { valor: '7 anos', rotulo: 'de studio em Piúma' },
  { valor: '+2.400', rotulo: 'atendimentos realizados' },
  { valor: '+180', rotulo: 'profissionais formadas' },
  { valor: '4,9/5', rotulo: 'média de avaliação' },
];

export default function PainelSite() {
  const [contato, setContato] = useState<Contato>({ ...site });
  const [imagens, setImagens] = useState<Fotos>({ ...fotos });
  const [numeros, setNumeros] = useState<Numero[]>(numerosPadrao);
  const [erros, setErros] = useState<string[]>([]);
  const [salvo, setSalvo] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/conteudo', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((dados: { contato?: Contato; fotos?: Fotos; numeros?: Numero[] }) => {
        if (dados.contato) setContato({ ...site, ...dados.contato });
        if (dados.fotos) setImagens({ ...fotos, ...dados.fotos });
        if (Array.isArray(dados.numeros)) setNumeros(dados.numeros);
      })
      .catch(() => undefined);
  }, []);

  async function salvar(chave: string, valor: unknown, rotulo: string) {
    setErros([]);
    setSalvando(true);
    try {
      await adminApi.salvarConteudo(chave, valor);
      setSalvo(rotulo);
      setTimeout(() => setSalvo(null), 3000);
    } catch (e) {
      setErros((e as { erros?: string[] }).erros ?? [(e as Error).message]);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-12">
      <Erros erros={erros} />
      {salvo && (
        <p role="status" className="rounded-2xl border border-blush-200 bg-sand px-5 py-4 text-sm text-ink">
          {salvo} salvo. Recarregue o site para ver.
        </p>
      )}

      <section className="space-y-5">
        <h2 className="font-display text-2xl text-ink">Contato e endereço</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Campo label="Nome do studio">
            <input
              className={campo}
              value={contato.name}
              onChange={(e) => setContato({ ...contato, name: e.target.value })}
            />
          </Campo>
          <Campo label="Telefone / WhatsApp">
            <input
              className={campo}
              value={contato.phone}
              onChange={(e) => setContato({ ...contato, phone: e.target.value })}
            />
          </Campo>
          <Campo label="E-mail">
            <input
              className={campo}
              value={contato.email}
              onChange={(e) => setContato({ ...contato, email: e.target.value })}
            />
          </Campo>
          <Campo label="Instagram (link)">
            <input
              className={campo}
              value={contato.instagram}
              onChange={(e) => setContato({ ...contato, instagram: e.target.value })}
            />
          </Campo>
          <Campo label="Endereço">
            <input
              className={campo}
              value={contato.address}
              onChange={(e) => setContato({ ...contato, address: e.target.value })}
            />
          </Campo>
          <Campo label="Horário de atendimento">
            <input
              className={campo}
              value={contato.hours}
              onChange={(e) => setContato({ ...contato, hours: e.target.value })}
            />
          </Campo>
        </div>

        <Botao carregando={salvando} onClick={() => salvar('contato', contato, 'Contato')}>
          Salvar contato
        </Botao>
      </section>

      <section className="space-y-5 border-t border-blush-100 pt-10">
        <h2 className="font-display text-2xl text-ink">Fotos do site</h2>
        <p className="text-sm text-ink-soft">
          Trocar aqui substitui as imagens de banco usadas hoje.
        </p>

        <Campo label="Foto principal (topo da home)">
          <EscolherImagem
            valor={imagens.hero}
            aoMudar={(url) => setImagens({ ...imagens, hero: url ?? '' })}
          />
        </Campo>

        <Campo label="Foto da seção “O studio”">
          <EscolherImagem
            valor={imagens.studio}
            aoMudar={(url) => setImagens({ ...imagens, studio: url ?? '' })}
          />
        </Campo>

        <Campo label="Foto da página de agendamento">
          <EscolherImagem
            valor={imagens.agendamento}
            aoMudar={(url) => setImagens({ ...imagens, agendamento: url ?? '' })}
          />
        </Campo>

        <Botao carregando={salvando} onClick={() => salvar('fotos', imagens, 'Fotos')}>
          Salvar fotos
        </Botao>
      </section>

      <section className="space-y-5 border-t border-blush-100 pt-10">
        <h2 className="font-display text-2xl text-ink">Números da home</h2>
        <p className="text-sm text-ink-soft">
          Os quatro destaques abaixo do topo. Use só números que você consegue comprovar.
        </p>

        {numeros.map((n, i) => (
          <div key={i} className="grid gap-4 md:grid-cols-2">
            <Campo label={`Destaque ${i + 1} número`}>
              <input
                className={campo}
                value={n.valor}
                onChange={(e) => {
                  const copia = [...numeros];
                  copia[i] = { ...n, valor: e.target.value };
                  setNumeros(copia);
                }}
              />
            </Campo>
            <Campo label="Texto">
              <input
                className={campo}
                value={n.rotulo}
                onChange={(e) => {
                  const copia = [...numeros];
                  copia[i] = { ...n, rotulo: e.target.value };
                  setNumeros(copia);
                }}
              />
            </Campo>
          </div>
        ))}

        <Botao carregando={salvando} onClick={() => salvar('numeros', numeros, 'Números')}>
          Salvar números
        </Botao>
      </section>
    </div>
  );
}

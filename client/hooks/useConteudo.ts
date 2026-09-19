import { useEffect, useState } from 'react';
import { fotos as fotosPadrao, servicos as servicosPadrao, site as sitePadrao } from '../data/site';
import type { Contato, FotosSite, Servico } from '../data/site';

type Numero = { valor: string; rotulo: string };

const numerosPadrao: Numero[] = [
  { valor: 'Hora marcada', rotulo: 'uma cliente por vez, sem fila' },
  { valor: 'Avaliação', rotulo: 'sem custo, antes do procedimento' },
  { valor: 'Descartáveis', rotulo: 'material individual a cada sessão' },
  { valor: '7 dias', rotulo: 'retorno para ajuste, sem custo' },
];

type ServicoApi = {
  slug: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  maintenance: string | null;
  priceCents: number;
  imageUrl: string | null;
};

function duracaoLegivel(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
}

/**
 * Conteúdo do site: o que o painel salvou, com o conteúdo do código como
 * padrão. Sem banco, ou antes de qualquer edição, o site fica exatamente como
 * está hoje nada de tela vazia.
 */
export function useConteudo() {
  const [site, setSite] = useState(sitePadrao);
  const [fotos, setFotos] = useState(fotosPadrao);
  const [numeros, setNumeros] = useState<Numero[]>(numerosPadrao);
  const [servicos, setServicos] = useState<Servico[]>(servicosPadrao);

  useEffect(() => {
    const controle = new AbortController();

    fetch('/api/conteudo', { signal: controle.signal })
      .then((r) => (r.ok ? r.json() : {}))
      .then((dados: { contato?: Contato; fotos?: FotosSite; numeros?: Numero[] }) => {
        if (dados.contato) setSite({ ...sitePadrao, ...dados.contato });
        if (dados.fotos) setFotos({ ...fotosPadrao, ...dados.fotos });
        if (Array.isArray(dados.numeros) && dados.numeros.length > 0) setNumeros(dados.numeros);
      })
      .catch(() => undefined);

    fetch('/api/conteudo/servicos', { signal: controle.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: ServicoApi[]) => {
        if (!Array.isArray(lista) || lista.length === 0) return;
        setServicos(
          lista.map((s) => ({
            slug: s.slug,
            titulo: s.name,
            descricao: s.description ?? '',
            duracao: duracaoLegivel(s.durationMinutes),
            manutencao: s.maintenance ?? '',
            preco: (s.priceCents / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            imagem: s.imageUrl ?? '',
            imagemAlt: s.name,
          })),
        );
      })
      .catch(() => undefined);

    return () => controle.abort();
  }, []);

  return { site, fotos, numeros, servicos };
}

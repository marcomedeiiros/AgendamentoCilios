export const site = {
  name: 'Lash&Co Studio',
  tagline: 'Design de olhar e formação profissional',
  phone: '(11) 4000-0000',
  whatsapp: '5511940000000',
  email: 'contato@lashco.com.br',
  address: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
  hours: 'Terça a sábado, das 9h às 19h',
  instagram: 'https://instagram.com/lashco.studio',
} as const;

export type Servico = {
  slug: string;
  titulo: string;
  descricao: string;
  duracao: string;
  manutencao: string;
  preco: string;
};

export const servicos: Servico[] = [
  {
    slug: 'fio-a-fio',
    titulo: 'Extensão fio a fio',
    descricao:
      'Um fio de extensão para cada fio natural. Resultado de efeito rímel, indicado para quem busca alongamento discreto no dia a dia.',
    duracao: '2h',
    manutencao: 'a cada 21 dias',
    preco: 'R$ 150',
  },
  {
    slug: 'volume-russo',
    titulo: 'Volume russo',
    descricao:
      'Leques montados manualmente com fios ultrafinos, para densidade e definição sem sobrecarregar o fio natural.',
    duracao: '2h30',
    manutencao: 'a cada 21 dias',
    preco: 'R$ 200',
  },
  {
    slug: 'lash-lifting',
    titulo: 'Lash lifting',
    descricao:
      'Curvatura permanente dos fios naturais com nutrição e tintura. Sem extensões e sem manutenção periódica.',
    duracao: '1h',
    manutencao: 'até 8 semanas',
    preco: 'R$ 120',
  },
];

export const cursos = [
  {
    id: 'formacao-completa',
    titulo: 'Formação completa em extensão de cílios',
    descricao:
      'Do fundamento ao volume russo: anatomia do fio, mapeamento do olhar, isolamento, colagem, biossegurança e precificação de serviço.',
    cargaHoraria: '40 horas',
    formato: 'Presencial + material de apoio online',
    preco: 'R$ 799,00',
    parcelas: 'ou 12x de R$ 79,90',
    imagem:
      'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800',
    destaque: true,
    inclui: [
      'Kit profissional de materiais incluso',
      'Prática supervisionada em modelo',
      'Certificado com carga horária',
      'Mentoria de 90 dias após a formação',
    ],
  },
  {
    id: 'masterclass-russo',
    titulo: 'Masterclass de volume russo',
    descricao:
      'Aperfeiçoamento para quem já atende: montagem de leques, mapeamentos avançados, retenção e correção de casos difíceis.',
    cargaHoraria: '16 horas',
    formato: 'Presencial, turmas de até 6 alunas',
    preco: 'R$ 450,00',
    parcelas: 'ou 12x de R$ 45,00',
    imagem:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    destaque: false,
    inclui: [
      'Pré-requisito: curso básico concluído',
      'Análise individual de portfólio',
      'Protocolo de retenção do studio',
      'Certificado com carga horária',
    ],
  },
] as const;

// Fotos do site. São imagens de banco (placeholder) — troque cada `src` pela
// foto real do studio. Se os arquivos forem locais, coloque-os em public/fotos/
// e use o caminho '/fotos/nome.jpg'. O `alt` descreve a imagem para leitores
// de tela e para quando a foto não carrega: reescreva junto com a troca.
const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

export const fotos = {
  hero: unsplash('photo-1487412947147-5cebf100ffc2', 1000),
  studio: unsplash('photo-1633681926022-84c23e8cb2d8', 1000),
  agendamento: unsplash('photo-1560066984-138dadb4c035', 1000),
} as const;

// `formato` controla o mosaico: 'destaque' ocupa 2x2, 'larga' ocupa 2 colunas.
// A ordem abaixo fecha um retângulo sem buraco; ao trocar as fotos, mantenha
// uma 'destaque', quatro sem formato e duas 'larga'.
export type Foto = { src: string; alt: string; formato?: 'destaque' | 'larga' };

export const galeria: Foto[] = [
  {
    src: unsplash('photo-1570172619644-dfd03ed5d881', 900),
    alt: 'Cliente deitada durante a aplicação, com os olhos fechados',
    formato: 'destaque',
  },
  {
    src: unsplash('photo-1595476108010-b4d1f102b1b1', 600),
    alt: 'Profissional preparando os materiais antes do atendimento',
  },
  {
    src: unsplash('photo-1526045478516-99145907023c', 600),
    alt: 'Pincéis e ferramentas organizados na bancada',
  },
  {
    src: unsplash('photo-1502823403499-6ccfcf4fb453', 600),
    alt: 'Retrato em perfil destacando o desenho do olhar',
  },
  {
    src: unsplash('photo-1616394584738-fc6e612e71b9', 600),
    alt: 'Etapa de cuidado da pele durante o procedimento',
  },
  {
    src: unsplash('photo-1596462502278-27bfdc403348', 900),
    alt: 'Produtos e cosméticos organizados na bancada do studio',
    formato: 'larga',
  },
  {
    src: unsplash('photo-1571875257727-256c39da42af', 900),
    alt: 'Composição de produtos de beleza usados no atendimento',
    formato: 'larga',
  },
];

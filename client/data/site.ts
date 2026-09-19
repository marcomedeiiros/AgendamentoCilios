// Fotos do site. São imagens de banco (placeholder) — troque cada `src` pela
// foto real do studio. Se os arquivos forem locais, coloque-os em public/fotos/
// e use o caminho '/fotos/nome.jpg'. O `alt` descreve a imagem para leitores
// de tela e para quando a foto não carrega: reescreva junto com a troca.
const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

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
  imagem: string;
  imagemAlt: string;
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
    imagem: unsplash('photo-1512290923902-8a9f81dc236c', 700),
    imagemAlt: 'Aplicação de extensão sendo feita fio a fio em uma cliente',
  },
  {
    slug: 'volume-russo',
    titulo: 'Volume russo',
    descricao:
      'Leques montados manualmente com fios ultrafinos, para densidade e definição sem sobrecarregar o fio natural.',
    duracao: '2h30',
    manutencao: 'a cada 21 dias',
    preco: 'R$ 200',
    imagem: unsplash('photo-1552693673-1bf958298935', 700),
    imagemAlt: 'Cliente deitada com os olhos fechados durante a aplicação de volume',
  },
  {
    slug: 'lash-lifting',
    titulo: 'Lash lifting',
    descricao:
      'Curvatura permanente dos fios naturais com nutrição e tintura. Sem extensões e sem manutenção periódica.',
    duracao: '1h',
    manutencao: 'até 8 semanas',
    preco: 'R$ 120',
    imagem: unsplash('photo-1531895861208-8504b98fe814', 700),
    imagemAlt: 'Aplicação de sérum de nutrição nos fios naturais',
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
    imagem: unsplash('photo-1599305090598-fe179d501227', 800),
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
    imagem: unsplash('photo-1522337360788-8b13dee7a37e', 800),
    destaque: false,
    inclui: [
      'Pré-requisito: curso básico concluído',
      'Análise individual de portfólio',
      'Protocolo de retenção do studio',
      'Certificado com carga horária',
    ],
  },
] as const;

export const fotos = {
  hero: unsplash('photo-1487412947147-5cebf100ffc2', 1000),
  studio: unsplash('photo-1633681926022-84c23e8cb2d6', 1000),
  agendamento: unsplash('photo-1560066984-138dadb4c035', 1000),
} as const;

export type Depoimento = {
  nome: string;
  texto: string;
  nota: number;
  servico: string;
  foto?: string | null;
};

// Depoimentos fixos do studio. Os enviados pelas clientes chegam da API
// (/api/depoimentos) e aparecem junto destes depois de aprovados.
export const depoimentosFixos: Depoimento[] = [
  {
    nome: 'Marina R.',
    servico: 'Volume russo',
    nota: 5,
    texto:
      'Resultado natural e simétrico, exatamente como foi combinado na avaliação. A retenção passou de quatro semanas.',
  },
  {
    nome: 'Camila T.',
    servico: 'Extensão fio a fio',
    nota: 5,
    texto:
      'O atendimento é pontual e o ambiente, impecável. Explicaram todos os cuidados antes e depois do procedimento.',
  },
  {
    nome: 'Juliana P.',
    servico: 'Curso / formação',
    nota: 5,
    texto:
      'Fiz a formação completa e saí atendendo com segurança. O suporte depois do curso fez toda a diferença.',
  },
];

/** Opções oferecidas no formulário — precisam bater com a lista do servidor. */
export const servicosDepoimento = [
  'Extensão fio a fio',
  'Volume russo',
  'Lash lifting',
  'Manutenção',
  'Curso / formação',
] as const;

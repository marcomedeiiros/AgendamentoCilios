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

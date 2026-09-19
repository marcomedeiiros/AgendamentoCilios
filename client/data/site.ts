// As fotos do site são do próprio studio e ficam em public/fotos/, referenciadas
// como '/fotos/nome.jpg'. Para trocar, o caminho normal é o painel em /admin —
// mexer aqui só muda o padrão de quando o banco ainda não tem nada salvo.
// O `alt` descreve a imagem para leitores de tela e para quando a foto não
// carrega: reescreva junto com a troca.

export type Contato = {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  instagram: string;
};

export const site: Contato = {
  name: 'Alicia Lash Designer',
  tagline: 'Design de olhar e formação profissional',
  phone: '(28) 99925-5874',
  whatsapp: '5528999255874',
  email: 'contato@alicialashdesigner.com.br',
  address: 'Piuma - ES',
  hours: 'Terça a sábado, das 9h às 19h',
  instagram: 'https://www.instagram.com/alicialashdesigner__?stkn=MXVwbW1uMGNvZGF5',
};

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
    imagem: '/fotos/fio-a-fio.jpg',
    imagemAlt: 'Olhar com extensão fio a fio feita no studio',
  },
  {
    slug: 'volume-russo',
    titulo: 'Volume russo',
    descricao:
      'Leques montados manualmente com fios ultrafinos, para densidade e definição sem sobrecarregar o fio natural.',
    duracao: '2h30',
    manutencao: 'a cada 21 dias',
    preco: 'R$ 200',
    imagem: '/fotos/volume-russo.jpg',
    imagemAlt: 'Olhar com volume russo feito no studio',
  },
  {
    slug: 'lash-lifting',
    titulo: 'Lash lifting',
    descricao:
      'Curvatura permanente dos fios naturais com nutrição e tintura. Sem extensões e sem manutenção periódica.',
    duracao: '1h',
    manutencao: 'até 8 semanas',
    preco: 'R$ 120',
    imagem: '/fotos/lash-lifting.jpg',
    imagemAlt: 'Olhar após lash lifting feito no studio',
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
    imagem: '/fotos/curso-formacao.jpg',
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
    imagem: '/fotos/curso-masterclass.jpg',
    destaque: false,
    inclui: [
      'Pré-requisito: curso básico concluído',
      'Análise individual de portfólio',
      'Protocolo de retenção do studio',
      'Certificado com carga horária',
    ],
  },
] as const;

export type FotosSite = { hero: string; studio: string; agendamento: string };

export const fotos: FotosSite = {
  hero: '/fotos/hero-olhar.jpg',
  studio: '/fotos/studio-alicia.jpg',
  agendamento: '/fotos/agendamento.jpg',
};

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

/** Opções oferecidas no formulário precisam bater com a lista do servidor. */
export const servicosDepoimento = [
  'Extensão fio a fio',
  'Volume russo',
  'Lash lifting',
  'Manutenção',
  'Curso / formação',
] as const;

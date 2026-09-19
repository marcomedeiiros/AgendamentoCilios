import type { CursoDetalhe } from '../lib/api';

/**
 * Conteúdo de vitrine dos cursos, igual ao que o seed grava no banco.
 *
 * Serve para a página não ficar vazia enquanto o banco não está configurado:
 * o catálogo e a tela do curso aparecem em modo prévia, sem botão de compra.
 * Assim que a API responde, estes dados são ignorados.
 */
export const cursosExemplo: CursoDetalhe[] = [
  {
    id: 'exemplo-formacao',
    slug: 'formacao-completa-online',
    title: 'Formação completa em extensão de cílios',
    subtitle: 'Do fundamento ao volume russo, no seu ritmo',
    description:
      'Curso gravado com o método usado no studio: anatomia do fio, mapeamento do olhar, isolamento, colagem, biossegurança e precificação do serviço.\n\nVocê assiste quantas vezes quiser e volta nas aulas sempre que precisar revisar.',
    priceCents: 79900,
    coverImage:
      'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800',
    level: 'Do zero ao avançado',
    durationHours: 12,
    forWho:
      'Para quem quer começar a atender com segurança, e para quem já mexe com beleza e quer somar a extensão de cílios ao serviço.',
    includes: [
      'Acesso vitalício às aulas gravadas',
      'Apostila digital para acompanhar',
      'Certificado com carga horária',
      'Suporte por 90 dias para tirar dúvidas',
    ],
    matriculada: false,
    aulas: [
      { title: 'Boas-vindas e materiais', gratuita: true },
      { title: 'Anatomia do fio e saúde do olhar', gratuita: false },
      { title: 'Mapeamento: escolhendo o desenho', gratuita: false },
      { title: 'Isolamento na prática', gratuita: false },
      { title: 'Colagem e tempo de secagem', gratuita: false },
      { title: 'Biossegurança do começo ao fim', gratuita: false },
      { title: 'Precificação e captação de clientes', gratuita: false },
    ].map((aula, i) => ({
      id: `exemplo-formacao-${i + 1}`,
      title: aula.title,
      description: null,
      position: i + 1,
      durationSeconds: null,
      gratuita: aula.gratuita,
      temVideo: false,
      liberada: aula.gratuita,
    })),
  },
  {
    id: 'exemplo-masterclass',
    slug: 'masterclass-volume-russo-online',
    title: 'Masterclass de volume russo',
    subtitle: 'Aperfeiçoamento para quem já atende',
    description:
      'Montagem de leques, mapeamentos avançados, retenção e correção de casos difíceis. Indicado para quem já fez o curso básico e quer subir o nível do atendimento.',
    priceCents: 45000,
    coverImage:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    level: 'Avançado',
    durationHours: 6,
    forWho: 'Para profissionais que já dominam o fio a fio e querem trabalhar com volume.',
    includes: [
      'Acesso vitalício às aulas gravadas',
      'Protocolo de retenção do studio',
      'Certificado com carga horária',
    ],
    matriculada: false,
    aulas: [
      { title: 'O que muda no volume russo', gratuita: true },
      { title: 'Montagem de leques passo a passo', gratuita: false },
      { title: 'Mapeamentos avançados', gratuita: false },
      { title: 'Retenção: o que realmente importa', gratuita: false },
      { title: 'Corrigindo trabalhos malfeitos', gratuita: false },
    ].map((aula, i) => ({
      id: `exemplo-masterclass-${i + 1}`,
      title: aula.title,
      description: null,
      position: i + 1,
      durationSeconds: null,
      gratuita: aula.gratuita,
      temVideo: false,
      liberada: aula.gratuita,
    })),
  },
];

export const catalogoExemplo = cursosExemplo.map((c) => ({
  id: c.id,
  slug: c.slug,
  title: c.title,
  subtitle: c.subtitle,
  description: c.description,
  priceCents: c.priceCents,
  coverImage: c.coverImage,
  level: c.level,
  durationHours: c.durationHours,
  totalAulas: c.aulas.length,
}));

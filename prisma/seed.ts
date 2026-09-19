import "dotenv/config";

import { prisma } from "../server/modules/shared/prisma";

// Cursos de exemplo para o ambiente de desenvolvimento. Roda com:
//   npm run db:seed
// É idempotente: rodar de novo atualiza, não duplica.
const cursos = [
  {
    slug: "formacao-completa-online",
    title: "Formação completa em extensão de cílios",
    subtitle: "Do fundamento ao volume russo, no seu ritmo",
    description:
      "Curso gravado com o método usado no studio: anatomia do fio, mapeamento do olhar, isolamento, colagem, biossegurança e precificação do serviço.\n\nVocê assiste quantas vezes quiser e volta nas aulas sempre que precisar revisar.",
    priceCents: 79900,
    published: true,
    aulas: [
      { title: "Boas-vindas e materiais", gratuita: true },
      { title: "Anatomia do fio e saúde do olhar", gratuita: false },
      { title: "Mapeamento: escolhendo o desenho", gratuita: false },
      { title: "Isolamento na prática", gratuita: false },
      { title: "Colagem e tempo de secagem", gratuita: false },
      { title: "Biossegurança do começo ao fim", gratuita: false },
      { title: "Precificação e captação de clientes", gratuita: false },
    ],
  },
  {
    slug: "masterclass-volume-russo-online",
    title: "Masterclass de volume russo",
    subtitle: "Aperfeiçoamento para quem já atende",
    description:
      "Montagem de leques, mapeamentos avançados, retenção e correção de casos difíceis. Indicado para quem já fez o curso básico e quer subir o nível do atendimento.",
    priceCents: 45000,
    published: true,
    aulas: [
      { title: "O que muda no volume russo", gratuita: true },
      { title: "Montagem de leques passo a passo", gratuita: false },
      { title: "Mapeamentos avançados", gratuita: false },
      { title: "Retenção: o que realmente importa", gratuita: false },
      { title: "Corrigindo trabalhos malfeitos", gratuita: false },
    ],
  },
];

async function main() {
  for (const { aulas, ...curso } of cursos) {
    const salvo = await prisma.course.upsert({
      where: { slug: curso.slug },
      create: curso,
      update: curso,
    });

    for (const [indice, aula] of aulas.entries()) {
      await prisma.lesson.upsert({
        where: { courseId_position: { courseId: salvo.id, position: indice + 1 } },
        create: { ...aula, position: indice + 1, courseId: salvo.id },
        update: { title: aula.title, gratuita: aula.gratuita },
      });
    }

    console.log(`curso "${salvo.title}" com ${aulas.length} aulas`);
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

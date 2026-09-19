import "dotenv/config";

import { auth } from "../server/modules/identity/auth";
import { prisma } from "../server/modules/shared/prisma";

/**
 * Cria (ou promove) a conta de administradora.
 *
 *   npm run admin:criar -- alicia@exemplo.com "SenhaForte123" "Alicia"
 *
 * A senha é passada para o Better Auth, que faz o hash — ela nunca é gravada
 * em texto puro nem fica no código. Se a conta já existir, o script só troca o
 * papel para admin, sem mexer na senha.
 */
async function main() {
  const [email, senha, nome] = process.argv.slice(2);

  if (!email || !senha) {
    console.error('Uso: npm run admin:criar -- <email> "<senha>" "<nome>"');
    process.exit(1);
  }

  if (senha.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const existente = await prisma.user.findUnique({ where: { email } });

  if (existente) {
    await prisma.user.update({ where: { email }, data: { role: "admin" } });
    console.log(`Conta ${email} promovida a admin.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password: senha, name: nome ?? "Administração" },
  });

  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`Conta ${email} criada como admin.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

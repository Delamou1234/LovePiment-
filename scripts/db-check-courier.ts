import { loadProjectEnv } from '../prisma/load-env';
import {
  resolveDemoCourierCredentials,
} from '../prisma/ensure-demo-courier';
import { verifyPassword } from '../src/shared/lib/auth/password';
import { isEmailConfigured } from '../src/shared/lib/email/mailer';

loadProjectEnv();

async function main() {
  const { prisma } = await import('../src/shared/lib/prisma');
  const { email, password } = resolveDemoCourierCredentials();

  try {
    const courier = await prisma.courier.findUnique({ where: { email } });
    if (!courier) {
      console.log(`✗ Aucun livreur avec l'e-mail ${email}`);
      console.log('  Lancez : npm run db:seed');
      process.exit(1);
    }

    if (!courier.passwordHash || !verifyPassword(password, courier.passwordHash)) {
      console.log(`✗ Mot de passe invalide pour ${email}`);
      console.log('  Relancez : npm run db:seed');
      process.exit(1);
    }

    if (!courier.actif) {
      console.log(`✗ Compte livreur ${email} désactivé (actif=false)`);
      process.exit(1);
    }

    const total = await prisma.courier.count();
    console.log(`✓ Table couriers OK — ${total} livreur(s)`);
    console.log(`✓ Connexion livreur démo : ${email} / ${password}`);
    console.log(`  URL : /connexion?redirect=/livreur`);
    console.log(
      isEmailConfigured()
        ? '✓ SMTP configuré — les e-mails de bienvenue seront envoyés'
        : 'ℹ SMTP non configuré — en dev, les e-mails s\'affichent dans la console serveur',
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('✗ Table couriers absente ou inaccessible');
    console.log(`  ${msg}`);
    console.log('  Lancez : npm run db:push && npm run db:seed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

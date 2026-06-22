import { loadProjectEnv } from '../prisma/load-env';

loadProjectEnv();

async function main() {
  const { prisma } = await import('../src/shared/lib/prisma');

  try {
    const count = await prisma.product.count();
    console.log(`✓ Table products OK — ${count} produit(s)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('✗ Table products absente ou inaccessible');
    console.log(`  ${msg}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

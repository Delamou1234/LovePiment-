export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  process.on('unhandledRejection', (reason) => {
    console.error('[love-piment] unhandledRejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[love-piment] uncaughtException:', error);
  });
}

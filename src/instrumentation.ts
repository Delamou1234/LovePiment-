export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  process.on('unhandledRejection', (reason) => {
    console.error('[kabishop] unhandledRejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[kabishop] uncaughtException:', error);
  });
}

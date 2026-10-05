import { buildApp } from './server.js';
const app = await buildApp();
try {
  await app.listen({ port: Number(process.env.PORT || 10000), host: '0.0.0.0' });
} catch (error) {
  app.log.error({ code: error.code }, 'Server startup failed');
  process.exitCode = 1;
}
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, async () => { await app.close(); process.exit(0); });
}

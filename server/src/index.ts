import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`🚀 BookSwap API demarree sur le port ${env.PORT}`);
  console.log(`   Environnement: ${env.NODE_ENV}`);
  console.log(`   Health check:  http://localhost:${env.PORT}/api/health`);
});

import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { env } from './utils/env-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(env.PORT);
}

bootstrap()
  .then(() => {
    console.log(`[APP]: Servidor rodando em: http://localhost:${env.PORT}`);
  })
  .catch((error) => {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  });

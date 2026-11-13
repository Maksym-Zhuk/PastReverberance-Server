import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await configureApp(app);
  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
  console.log('Server started');
}
bootstrap();

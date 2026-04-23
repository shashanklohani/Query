import { loadEnvFile } from 'node:process';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const envFilePath = resolve(__dirname, '..', '.env');

  if (existsSync(envFilePath)) {
    loadEnvFile(envFilePath);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : true;

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const uploadsRoot = resolve(process.env.FILE_STORAGE_ROOT ?? 'uploads');

  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads/',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Query API')
    .setDescription('API documentation for the Query NestJS backend.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

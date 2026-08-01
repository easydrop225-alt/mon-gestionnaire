import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { AppModule } from '../src/app.module';

/**
 * Point d'entrée Vercel Serverless pour l'API NestJS.
 *
 * Vercel exécute cette fonction à froid (cold start) au premier appel, puis
 * réutilise l'instance ("warm") pour les appels suivants tant que le conteneur
 * reste actif — on met donc en cache l'app Nest + le handler Express entre
 * les invocations pour éviter de tout reconstruire à chaque requête.
 */
let cachedServer: ReturnType<typeof serverlessExpress> | undefined;

async function bootstrapServer() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.init();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer(req, res);
}

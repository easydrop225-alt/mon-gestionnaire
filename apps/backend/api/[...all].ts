import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from '../src/app.module';

/**
 * Point d'entrée Vercel Serverless pour l'API NestJS.
 *
 * Ce fichier s'appelle `[...all].ts` (route "catch-all") : Vercel détecte
 * automatiquement tout fichier dans /api comme une fonction serverless, et
 * ce nom spécial fait que CETTE fonction répond à TOUTES les routes sous
 * /api/* (donc /api/v1/auth/login, /api/v1/products, etc. y compris).
 * Aucun fichier vercel.json n'est nécessaire — Vercel rejetait nos tentatives
 * précédentes de configuration manuelle ("Invalid vercel.json file provided"),
 * cette approche "zero-config" est plus robuste et recommandée par Vercel.
 *
 * IMPORTANT : Vercel n'appelle PAS les fonctions Node.js au format "événement
 * AWS Lambda" (event, context) — il les appelle exactement comme un serveur
 * HTTP classique, avec (req, res) bruts, à la façon d'Express. On transmet
 * donc directement la requête à l'application Express sous-jacente créée par
 * Nest, sans passer par un traducteur d'événements Lambda.
 *
 * L'app Nest est initialisée une seule fois puis réutilisée entre les
 * invocations "chaudes" du conteneur serverless.
 */
const expressApp = express();
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
}

export default async function handler(req: any, res: any) {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap();
  }
  await bootstrapPromise;
  expressApp(req, res);
}

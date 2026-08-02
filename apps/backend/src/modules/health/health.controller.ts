import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Endpoint de diagnostic public (aucune authentification requise).
 * Utile pour vérifier rapidement, en visitant simplement l'URL dans un
 * navigateur, si la connexion à la base de données fonctionne et si les
 * variables d'environnement essentielles sont bien définies — sans avoir
 * besoin de consulter les logs Vercel.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const env = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
      FRONTEND_URL: !!process.env.FRONTEND_URL,
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: 'ok', env };
    } catch (error: any) {
      return { database: 'error', message: String(error?.message ?? error).slice(0, 400), env };
    }
  }
}

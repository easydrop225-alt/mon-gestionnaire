import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Garde d'accès à la console admin plateforme — accepte DEUX méthodes :
 *
 * 1. Le secret partagé (`x-admin-secret`), utile en dépannage / amorçage.
 * 2. Un compte Super Admin authentifié normalement (JWT via /auth/login),
 *    identifié par `user.isSuperAdmin = true` — l'usage recommandé au
 *    quotidien, avec une vraie identité personnelle plutôt qu'un mot de
 *    passe partagé.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const providedSecret = request.headers['x-admin-secret'];
    const expectedSecret = process.env.PLATFORM_ADMIN_SECRET;
    if (providedSecret && expectedSecret && providedSecret === expectedSecret) {
      return true;
    }

    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload: any = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (user?.isSuperAdmin && user.status === 'ACTIVE' && !user.deletedAt) {
          request.superAdmin = user;
          return true;
        }
      } catch {
        // Jeton invalide ou expiré — tombe sur le refus ci-dessous.
      }
    }

    throw new UnauthorizedException('Accès administrateur plateforme refusé.');
  }
}

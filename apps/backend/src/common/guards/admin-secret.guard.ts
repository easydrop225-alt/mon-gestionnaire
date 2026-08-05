import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Vérifie uniquement le secret partagé (PLATFORM_ADMIN_SECRET). Utilisé pour
 * les opérations d'amorçage sensibles (créer un compte Super Admin) où aucun
 * compte n'existe encore forcément pour s'authentifier normalement.
 */
@Injectable()
export class AdminSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-admin-secret'];
    const expected = process.env.PLATFORM_ADMIN_SECRET;

    if (!expected) throw new UnauthorizedException('PLATFORM_ADMIN_SECRET non configuré côté serveur.');
    if (!provided || provided !== expected) throw new UnauthorizedException('Accès refusé.');
    return true;
  }
}

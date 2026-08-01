import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Garde d'accès RÉSERVÉE au propriétaire de la plateforme (toi), distincte du
 * système JWT par tenant. Nécessaire car "éditer l'abonnement de N'IMPORTE
 * QUELLE entreprise" est une opération transverse à tous les tenants — le
 * modèle RBAC normal (un admin de tenant ne gère que SON tenant) ne peut pas
 * s'appliquer ici par construction.
 *
 * Fonctionnement volontairement simple : un secret partagé envoyé dans l'en-tête
 * `x-admin-secret`, comparé à la variable d'environnement PLATFORM_ADMIN_SECRET.
 * Suffisant pour un usage interne à faible fréquence (toi uniquement) ; si cet
 * accès doit un jour être ouvert à plusieurs personnes, le remplacer par un
 * vrai compte + rôle "super admin" en base.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedSecret = request.headers['x-admin-secret'];
    const expectedSecret = process.env.PLATFORM_ADMIN_SECRET;

    if (!expectedSecret) {
      throw new UnauthorizedException('PLATFORM_ADMIN_SECRET non configuré côté serveur.');
    }
    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Accès administrateur plateforme refusé.');
    }
    return true;
  }
}

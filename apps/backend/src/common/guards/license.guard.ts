import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

// Vérifie que l'entreprise (tenant) dispose d'une licence active.
// Contrôle SERVEUR uniquement — jamais de confiance envers le client.
@Injectable()
export class LicenseGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const license = user?.license;
    if (!license) throw new ForbiddenException('Aucune licence associée à cette entreprise.');

    const now = new Date();
    const isTrialExpired = license.status === 'TRIAL' && license.trialEndsAt && license.trialEndsAt < now;
    // Un abonnement ACTIVE dont la période payée (currentPeriodEnd) est dépassée est
    // traité comme expiré en temps réel. Un accès à vie (isLifetime) n'expire jamais,
    // quelle que soit la valeur de currentPeriodEnd.
    const isPeriodExpired =
      license.status === 'ACTIVE' && !license.isLifetime && license.currentPeriodEnd && license.currentPeriodEnd < now;
    const isBlocked = ['SUSPENDED', 'CANCELLED'].includes(license.status) || isTrialExpired || isPeriodExpired;
    if (isBlocked) {
      throw new ForbiddenException("Licence expirée ou suspendue. Merci de renouveler votre abonnement.");
    }
    return true;
  }
}

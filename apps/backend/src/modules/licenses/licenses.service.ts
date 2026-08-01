import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PLANS } from '../../config/plans.config';

/**
 * LICENSING — modèle "compte + entitlement serveur".
 * Identifiant utilisateur = email (+ téléphone en option), PAS de clé de licence saisie
 * par l'utilisateur lui-même — seul un CODE D'ACCÈS (voir AccessCodesModule) permet
 * actuellement de créditer une licence. Vérifié à CHAQUE requête via LicenseGuard.
 */
@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  async getForTenant(tenantId: string) {
    const license = await this.prisma.license.findUnique({ where: { tenantId } });
    if (!license) throw new NotFoundException('Aucune licence trouvée pour cette entreprise.');
    return license;
  }

  async hasFeature(tenantId: string, featureCode: string): Promise<boolean> {
    const license = await this.getForTenant(tenantId);
    const features = (license.features as string[]) ?? [];
    return features.includes(featureCode);
  }

  async assertSeatAvailable(tenantId: string) {
    const license = await this.getForTenant(tenantId);
    if (license.seatsUsed >= license.seats) {
      throw new ForbiddenException(
        `Limite de ${license.seats} utilisateur(s) atteinte pour votre plan ${license.plan}. Merci de mettre à niveau votre abonnement.`,
      );
    }
  }

  async incrementSeatUsage(tenantId: string) {
    await this.prisma.license.update({ where: { tenantId }, data: { seatsUsed: { increment: 1 } } });
  }

  async decrementSeatUsage(tenantId: string) {
    await this.prisma.license.update({ where: { tenantId }, data: { seatsUsed: { decrement: 1 } } });
  }

  /**
   * Point d'entrée UNIQUE pour créditer une période d'accès à un tenant, appelé
   * exclusivement par AccessCodesService.redeem() pour l'instant.
   *
   * - periodDays défini  -> prolonge la période en cours (un renouvellement
   *   anticipé ne fait jamais perdre de jours déjà payés).
   * - periodDays null/undefined -> ACCÈS À VIE : currentPeriodEnd est mis à
   *   null et isLifetime à true. LicenseGuard ne vérifiera alors plus jamais
   *   d'expiration pour ce tenant.
   */
  async grantPeriod(params: {
    tenantId: string;
    plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
    periodDays?: number | null;
    seats?: number;
  }) {
    const planDef = PLANS[params.plan];
    const isLifetime = params.periodDays === null || params.periodDays === undefined;

    let currentPeriodEnd: Date | null = null;
    if (!isLifetime) {
      const now = new Date();
      const existing = await this.prisma.license.findUnique({ where: { tenantId: params.tenantId } });
      const base = existing?.currentPeriodEnd && existing.currentPeriodEnd > now ? existing.currentPeriodEnd : now;
      currentPeriodEnd = new Date(base.getTime() + params.periodDays! * 24 * 60 * 60 * 1000);
    }

    const data = {
      plan: params.plan,
      status: 'ACTIVE' as const,
      seats: params.seats ?? planDef.seats,
      features: planDef.features,
      isLifetime,
      currentPeriodEnd,
    };

    return this.prisma.license.upsert({
      where: { tenantId: params.tenantId },
      update: data,
      create: { tenantId: params.tenantId, ...data },
    });
  }
}

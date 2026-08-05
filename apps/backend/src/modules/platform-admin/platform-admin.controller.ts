import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { UpsertPriceDto } from './dto/upsert-price.dto';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PLANS } from '../../config/plans.config';
import { DURATION_DAYS } from '../../config/durations.config';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { GenerateCodesDto } from '../access-codes/dto/generate-codes.dto';

@Controller('admin')
@UseGuards(PlatformAdminGuard)
export class PlatformAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessCodesService: AccessCodesService,
  ) {}

  /**
   * Liste toutes les entreprises avec leur licence.
   * Filtres optionnels (query params) :
   *   ?status=ACTIVE|TRIAL|PAST_DUE|SUSPENDED|CANCELLED  (statut de licence)
   *   ?plan=STARTER|PRO|ENTERPRISE
   *   ?search=texte  (recherche sur le nom de l'entreprise)
   *   ?expiringWithinDays=7  (licences expirant dans les N prochains jours)
   */
  @Get('tenants')
  async listTenants(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('search') search?: string,
    @Query('expiringWithinDays') expiringWithinDays?: string,
  ) {
    const licenseFilter: Record<string, any> = {};
    if (status) licenseFilter.status = status;
    if (plan) licenseFilter.plan = plan;
    if (expiringWithinDays) {
      const days = Number(expiringWithinDays);
      const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      licenseFilter.isLifetime = false;
      licenseFilter.currentPeriodEnd = { lte: limit, gte: new Date() };
    }

    const tenants = await this.prisma.tenant.findMany({
      where: {
        slug: { not: 'plateforme-administration' }, // exclut le tenant technique des Super Admins
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        ...(Object.keys(licenseFilter).length ? { license: { is: licenseFilter } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        license: true,
        _count: { select: { users: true, products: true } },
      },
    });

    // Petit résumé utile pour l'en-tête de la console (cartes de synthèse).
    const summary = {
      total: tenants.length,
      active: tenants.filter((t) => t.license?.status === 'ACTIVE').length,
      trial: tenants.filter((t) => t.license?.status === 'TRIAL').length,
      pastDueOrSuspended: tenants.filter((t) => ['PAST_DUE', 'SUSPENDED'].includes(t.license?.status ?? '')).length,
      lifetime: tenants.filter((t) => t.license?.isLifetime).length,
    };

    return { tenants, summary };
  }

  /**
   * Modifie la licence d'une entreprise. Deux façons de fixer l'expiration :
   * - fournir `currentPeriodEnd` directement, OU
   * - fournir `duration` (+ `customDays` si CUSTOM) et `activationDate`
   *   (optionnelle, défaut = maintenant) pour un calcul automatique.
   *
   * GARANTIE : ne touche QUE la ligne `License`. Aucune donnée de
   * l'entreprise (utilisateurs, produits...) n'est jamais supprimée ou
   * modifiée par cette action — réactiver un abonnement expiré restaure
   * l'accès complet aux données existantes, intactes.
   */
  @Patch('tenants/:tenantId/license')
  async updateLicense(@Param('tenantId') tenantId: string, @Body() dto: UpdateLicenseDto) {
    const data: Record<string, any> = {};
    if (dto.plan) data.plan = dto.plan;
    if (dto.status) data.status = dto.status;
    if (dto.seats) data.seats = dto.seats;
    if (dto.isLifetime !== undefined) data.isLifetime = dto.isLifetime;

    if (dto.isLifetime) {
      data.currentPeriodEnd = null;
    } else if (dto.duration) {
      const activationDate = dto.activationDate ? new Date(dto.activationDate) : new Date();
      let days: number;
      if (dto.duration === 'CUSTOM') {
        if (!dto.customDays) throw new BadRequestException('customDays requis pour une durée personnalisée.');
        days = dto.customDays;
      } else {
        days = DURATION_DAYS[dto.duration as Exclude<typeof dto.duration, 'CUSTOM'>] as number;
      }
      data.currentPeriodEnd = new Date(activationDate.getTime() + days * 24 * 60 * 60 * 1000);
      data.isLifetime = false;
    } else if (dto.currentPeriodEnd) {
      data.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    }

    return this.prisma.license.update({ where: { tenantId }, data });
  }

  // ---------------------------------------------------------------------
  // TARIFICATION — prix par défaut (plan x durée), consultés/édités ici.
  // ---------------------------------------------------------------------

  @Get('pricing')
  async listPricing() {
    const configs = await this.prisma.priceConfig.findMany();
    // Retourne une grille complète (plan x durée), même pour les combinaisons
    // pas encore configurées, avec priceFcfa = null dans ce cas.
    const plans = Object.keys(PLANS);
    const durations = ['MONTHLY', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME'];
    return plans.flatMap((plan) =>
      durations.map((duration) => {
        const existing = configs.find((c) => c.plan === plan && c.duration === duration);
        return { plan, duration, priceFcfa: existing?.priceFcfa ?? null };
      }),
    );
  }

  @Patch('pricing')
  async upsertPricing(@Body() dto: UpsertPriceDto) {
    return this.prisma.priceConfig.upsert({
      where: { plan_duration: { plan: dto.plan, duration: dto.duration } },
      update: { priceFcfa: dto.priceFcfa },
      create: { plan: dto.plan, duration: dto.duration, priceFcfa: dto.priceFcfa },
    });
  }

  // ---------------------------------------------------------------------
  // CODES D'ACCÈS — génération et suivi (action de l'admin plateforme).
  // ---------------------------------------------------------------------

  @Post('access-codes/generate')
  async generateCodes(@Body() dto: GenerateCodesDto) {
    return this.accessCodesService.generateBatch({ ...dto, createdBy: 'platform-admin' });
  }

  @Get('access-codes/batch/:batchId')
  async listCodesBatch(@Param('batchId') batchId: string) {
    return this.accessCodesService.listBatch(batchId);
  }
}

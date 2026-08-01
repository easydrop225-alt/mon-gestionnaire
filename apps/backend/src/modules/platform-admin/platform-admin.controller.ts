import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { PlatformAdminGuard } from './platform-admin.guard';

@Controller('admin')
@UseGuards(PlatformAdminGuard)
export class PlatformAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste toutes les entreprises avec leur licence, pour repérer un abonnement à corriger. */
  @Get('tenants')
  async listTenants() {
    return this.prisma.tenant.findMany({
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
  }

  /**
   * Modifie UNIQUEMENT la ligne `License` du tenant ciblé — plan, statut,
   * sièges, date d'expiration ou passage en accès à vie.
   *
   * GARANTIE : cette opération ne touche JAMAIS aux utilisateurs, produits,
   * ou toute autre donnée de l'entreprise. Réactiver un abonnement expiré
   * (même après plusieurs mois) restaure l'accès complet aux données
   * existantes, qui n'ont jamais été supprimées — LicenseGuard se contente de
   * bloquer les requêtes tant que la licence n'est pas active, il ne détruit
   * jamais rien.
   */
  @Patch('tenants/:tenantId/license')
  async updateLicense(@Param('tenantId') tenantId: string, @Body() dto: UpdateLicenseDto) {
    const data: Record<string, any> = { ...dto };
    if (dto.currentPeriodEnd) {
      data.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    }

    return this.prisma.license.update({
      where: { tenantId },
      data,
    });
  }
}

import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LicensesService } from '../licenses/licenses.service';
import { PLANS } from '../../config/plans.config';
import { DURATION_DAYS, CodeDurationCode } from '../../config/durations.config';

/**
 * SYSTÈME DE CODES D'ACCÈS — seul moyen de paiement actif pour l'instant.
 *
 * Principe :
 * - L'entreprise génère des lots de codes (ex: 50 codes "Pro / 6 mois").
 * - Les codes sont vendus PAR N'IMPORTE QUEL CANAL (en personne, transfert Wave
 *   manuel vers le numéro perso, revendeur, etc.) — aucune intégration de
 *   paiement requise pour cette voie.
 * - Le décompte de la période NE COMMENCE PAS à la génération, mais à la
 *   PREMIÈRE UTILISATION (redemption). Un code LIFETIME n'expire jamais.
 *
 * SÉCURITÉ ANTI-PARTAGE (critique pour les codes LIFETIME, à forte valeur) :
 * - L'activation UNUSED -> ACTIVE se fait via une écriture SQL conditionnelle
 *   atomique (`updateMany` avec `WHERE status = 'UNUSED'`), pas un
 *   "lire-puis-écrire". Cela empêche deux activations simultanées du même
 *   code (race condition) de réussir toutes les deux.
 * - Le tenant ET l'e-mail qui activent le code sont enregistrés de façon
 *   permanente sur l'enregistrement. Une fois ACTIVE, REVOKED ou EXPIRED,
 *   un code ne peut plus jamais être réactivé — y compris par son acheteur
 *   d'origine, y compris s'il supprime son compte.
 */
@Injectable()
export class AccessCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly licensesService: LicensesService,
  ) {}

  /** Génère un lot de codes uniques, lisibles et faciles à recopier à la main. */
  async generateBatch(params: {
    plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
    duration: CodeDurationCode;
    customDays?: number;
    quantity: number;
    priceFcfa?: number;
    soldChannel?: string;
    createdBy: string;
  }) {
    if (!PLANS[params.plan]) throw new BadRequestException('Plan inconnu.');

    let periodDays: number | null;
    if (params.duration === 'CUSTOM') {
      if (!params.customDays || params.customDays < 1) {
        throw new BadRequestException('Merci de préciser un nombre de jours pour une durée personnalisée.');
      }
      periodDays = params.customDays;
    } else {
      if (!(params.duration in DURATION_DAYS)) throw new BadRequestException('Durée inconnue.');
      periodDays = DURATION_DAYS[params.duration as Exclude<CodeDurationCode, 'CUSTOM'>];
    }

    const batchId = randomUUID();
    const codes = Array.from({ length: params.quantity }, () => generateReadableCode());

    await this.prisma.accessCode.createMany({
      data: codes.map((code) => ({
        code,
        batchId,
        plan: params.plan,
        duration: params.duration,
        periodDays,
        priceFcfa: params.priceFcfa,
        soldChannel: params.soldChannel,
        createdBy: params.createdBy,
        status: 'UNUSED',
      })),
    });

    return { batchId, duration: params.duration, count: codes.length, codes };
  }

  /** Liste les codes d'un lot (pour export/impression avant vente). */
  async listBatch(batchId: string) {
    return this.prisma.accessCode.findMany({ where: { batchId }, orderBy: { createdAt: 'asc' } });
  }

  /**
   * Active un code pour l'entreprise (tenant) et l'e-mail de l'utilisateur connecté.
   * C'est ICI que la période commence à compter, jamais avant.
   */
  async redeem(rawCode: string, tenantId: string, email: string) {
    const code = rawCode.trim().toUpperCase();

    const accessCode = await this.prisma.accessCode.findUnique({ where: { code } });
    if (!accessCode) throw new BadRequestException('Code invalide.');
    if (accessCode.status !== 'UNUSED') {
      throw new ConflictException(
        "Ce code a déjà été utilisé et ne peut pas être réactivé, y compris par son premier détenteur.",
      );
    }

    const now = new Date();
    const expiresAt = accessCode.periodDays ? new Date(now.getTime() + accessCode.periodDays * 24 * 60 * 60 * 1000) : null;

    // Écriture CONDITIONNELLE atomique : ne réussit que si le code est encore
    // UNUSED au moment précis de l'écriture (protège contre deux activations
    // simultanées du même code par deux personnes différentes).
    const result = await this.prisma.accessCode.updateMany({
      where: { code, status: 'UNUSED' },
      data: { status: 'ACTIVE', tenantId, redeemedByEmail: email, redeemedAt: now, expiresAt },
    });

    if (result.count === 0) {
      throw new ConflictException('Ce code vient d\'être activé par quelqu\'un d\'autre à l\'instant.');
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: accessCode.duration === 'LIFETIME' ? 'access_code.redeemed.lifetime' : 'access_code.redeemed',
        result: 'success',
        metadata: { code, plan: accessCode.plan, duration: accessCode.duration, email },
      },
    });

    await this.licensesService.grantPeriod({
      tenantId,
      plan: accessCode.plan as 'STARTER' | 'PRO' | 'ENTERPRISE',
      periodDays: accessCode.periodDays,
    });

    return {
      message: accessCode.duration === 'LIFETIME'
        ? 'Accès à vie activé avec succès pour cette entreprise.'
        : 'Code activé avec succès.',
      plan: accessCode.plan,
      duration: accessCode.duration,
      expiresAt,
    };
  }
}

/** Génère un code lisible du type MG-7F3K-9XQ2-P1LM (évite les caractères ambigus 0/O, 1/I). */
function generateReadableCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const group = () =>
    Array.from({ length: 4 }, () => alphabet[randomBytes(1)[0] % alphabet.length]).join('');
  return `MG-${group()}-${group()}-${group()}`;
}

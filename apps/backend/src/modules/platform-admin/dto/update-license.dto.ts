import { IsIn, IsOptional, IsInt, IsBoolean, IsISO8601, Min } from 'class-validator';

export class UpdateLicenseDto {
  @IsOptional() @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsOptional() @IsIn(['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'])
  status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

  @IsOptional() @IsInt() @Min(1)
  seats?: number;

  // Mode 1 — édition directe : nouvelle date de fin de période (ISO). Ignoré si `duration` est fourni.
  @IsOptional() @IsISO8601()
  currentPeriodEnd?: string;

  @IsOptional() @IsBoolean()
  isLifetime?: boolean;

  // Mode 2 — application rapide par durée : calcule automatiquement la date de
  // fin à partir d'une date d'activation (par défaut aujourd'hui) + une durée.
  @IsOptional() @IsIn(['MONTHLY', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'CUSTOM'])
  duration?: 'MONTHLY' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'CUSTOM';

  @IsOptional() @IsInt() @Min(1)
  customDays?: number;

  // Date à partir de laquelle la durée ci-dessus est comptée. Permet
  // d'antidater (paiement reçu la semaine dernière) ou de programmer une
  // activation future. Par défaut : maintenant.
  @IsOptional() @IsISO8601()
  activationDate?: string;
}

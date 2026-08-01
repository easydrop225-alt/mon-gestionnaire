import { IsIn, IsOptional, IsInt, IsBoolean, IsISO8601, Min } from 'class-validator';

export class UpdateLicenseDto {
  @IsOptional() @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsOptional() @IsIn(['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'])
  status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

  @IsOptional() @IsInt() @Min(1)
  seats?: number;

  // Nouvelle date de fin de période. Passe `null` pour un accès à vie.
  @IsOptional() @IsISO8601()
  currentPeriodEnd?: string;

  @IsOptional() @IsBoolean()
  isLifetime?: boolean;
}

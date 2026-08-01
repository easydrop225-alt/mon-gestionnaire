import { IsIn, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class GenerateCodesDto {
  @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsIn(['THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME'])
  duration: 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME';

  @IsInt() @Min(1) @Max(1000)
  quantity: number;

  @IsOptional() @IsInt()
  priceFcfa?: number;

  @IsOptional() @IsString()
  soldChannel?: string; // ex: "Vente en personne", "Transfert Wave direct"
}

import { IsIn, IsInt, IsOptional, IsString, Min, Max, ValidateIf } from 'class-validator';

export class GenerateCodesDto {
  @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsIn(['MONTHLY', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'CUSTOM', 'LIFETIME'])
  duration: 'MONTHLY' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'CUSTOM' | 'LIFETIME';

  // Requis uniquement si duration = 'CUSTOM'
  @ValidateIf((o) => o.duration === 'CUSTOM')
  @IsInt() @Min(1) @Max(3650)
  customDays?: number;

  @IsInt() @Min(1) @Max(1000)
  quantity: number;

  @IsOptional() @IsInt()
  priceFcfa?: number;

  @IsOptional() @IsString()
  soldChannel?: string;
}

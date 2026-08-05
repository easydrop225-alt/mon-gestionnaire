import { IsIn, IsInt, Min } from 'class-validator';

export class UpsertPriceDto {
  @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsIn(['MONTHLY', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS', 'LIFETIME'])
  duration: 'MONTHLY' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME';

  @IsInt() @Min(0)
  priceFcfa: number;
}

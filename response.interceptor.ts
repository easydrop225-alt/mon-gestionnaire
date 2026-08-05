import { IsString, Length } from 'class-validator';

export class RedeemCodeDto {
  @IsString() @Length(10, 32)
  code: string;
}

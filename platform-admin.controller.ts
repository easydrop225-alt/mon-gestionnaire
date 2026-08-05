import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString() tenantName: string;
  @IsEmail() email: string;
  @IsOptional() @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numéro de téléphone invalide' }) phone?: string;
  @IsString() @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' }) password: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
}

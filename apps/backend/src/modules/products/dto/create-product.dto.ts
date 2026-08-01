import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() sku?: string;
  @IsInt() @Min(0) priceFcfa: number;
  @IsOptional() @IsInt() @Min(0) stockQuantity?: number;
}

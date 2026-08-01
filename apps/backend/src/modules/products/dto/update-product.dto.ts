import { IsString, IsInt, Min, IsOptional, IsIn } from 'class-validator';

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsInt() @Min(0) priceFcfa?: number;
  @IsOptional() @IsInt() @Min(0) stockQuantity?: number;
  @IsOptional() @IsIn(['ACTIVE', 'ARCHIVED']) status?: 'ACTIVE' | 'ARCHIVED';
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { LicenseGuard } from '../../common/guards/license.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, LicenseGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Permissions('products.read')
  list(@CurrentUser() user: { tenantId: string }) {
    return this.productsService.list(user.tenantId);
  }

  @Post()
  @Permissions('products.create')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: { tenantId: string }) {
    return this.productsService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @Permissions('products.update')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: { tenantId: string }) {
    return this.productsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('products.delete')
  remove(@Param('id') id: string, @CurrentUser() user: { tenantId: string }) {
    return this.productsService.remove(user.tenantId, id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { tenantId, name: dto.name, sku: dto.sku, priceFcfa: dto.priceFcfa, stockQuantity: dto.stockQuantity ?? 0 },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Produit introuvable.');
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Produit introuvable.');
    // Soft delete (cf. 05_ARCHITECTURE_PART_2.md - Soft Delete)
    return this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

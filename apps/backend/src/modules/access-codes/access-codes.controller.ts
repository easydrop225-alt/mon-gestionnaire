import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccessCodesService } from './access-codes.service';
import { GenerateCodesDto } from './dto/generate-codes.dto';
import { RedeemCodeDto } from './dto/redeem-code.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('access-codes')
@UseGuards(JwtAuthGuard)
export class AccessCodesController {
  constructor(private readonly accessCodesService: AccessCodesService) {}

  /** Réservé à l'équipe interne (vous) — génère un lot de codes à vendre. */
  @Post('generate')
  @UseGuards(PermissionsGuard)
  @Permissions('licenses.manage')
  generate(@Body() dto: GenerateCodesDto, @CurrentUser() user: { id: string }) {
    return this.accessCodesService.generateBatch({ ...dto, createdBy: user.id });
  }

  @Get('batch/:batchId')
  @UseGuards(PermissionsGuard)
  @Permissions('licenses.manage')
  listBatch(@Param('batchId') batchId: string) {
    return this.accessCodesService.listBatch(batchId);
  }

  /** Utilisé par n'importe quel client final pour activer son code d'accès. */
  @Post('redeem')
  redeem(@Body() dto: RedeemCodeDto, @CurrentUser() user: { tenantId: string; email: string }) {
    return this.accessCodesService.redeem(dto.code, user.tenantId, user.email);
  }
}

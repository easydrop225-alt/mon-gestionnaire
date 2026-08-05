import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AccessCodesService } from './access-codes.service';
import { RedeemCodeDto } from './dto/redeem-code.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// La génération de codes est une action de l'admin PLATEFORME (toi), pas
// d'une entreprise cliente — voir PlatformAdminController (/admin/access-codes/*).
@Controller('access-codes')
@UseGuards(JwtAuthGuard)
export class AccessCodesController {
  constructor(private readonly accessCodesService: AccessCodesService) {}

  /** Utilisé par n'importe quel client final pour activer son code d'accès. */
  @Post('redeem')
  redeem(@Body() dto: RedeemCodeDto, @CurrentUser() user: { tenantId: string; email: string }) {
    return this.accessCodesService.redeem(dto.code, user.tenantId, user.email);
  }
}

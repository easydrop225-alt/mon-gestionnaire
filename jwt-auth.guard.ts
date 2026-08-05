import { Controller, Get, UseGuards } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('licenses')
@UseGuards(JwtAuthGuard)
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Get('me')
  getMyLicense(@CurrentUser() user: { tenantId: string }) {
    return this.licensesService.getForTenant(user.tenantId);
  }
}

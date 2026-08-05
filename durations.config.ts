import { Body, Controller, Post, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminSecretGuard } from '../../common/guards/admin-secret.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  /** Amorçage : crée un compte Super Admin. Protégé par le code secret plateforme. */
  @Post('register-super-admin')
  @UseGuards(AdminSecretGuard)
  registerSuperAdmin(@Body() dto: RegisterSuperAdminDto) { return this.authService.registerSuperAdmin(dto); }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body('refreshToken') refreshToken: string) { return this.authService.refresh(refreshToken); }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: { sessionId: string }) { return this.authService.logout(user.sessionId); }
}

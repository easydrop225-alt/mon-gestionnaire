import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashSecret, verifySecret } from '../../common/crypto/password.util';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  // Crée un Tenant + un Administrateur + une licence d'essai (14 jours).
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet e-mail.');

    const passwordHash = await hashSecret(dto.password);
    const slug = dto.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.tenantName, slug: `${slug}-${randomUUID().slice(0, 6)}`, status: 'TRIAL' },
      });

      const adminRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'Administrateur', isSystem: true },
      });

      const allPermissions = await tx.permission.findMany();
      if (allPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: allPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
        });
      }

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id, email: dto.email, phone: dto.phone, passwordHash,
          firstName: dto.firstName, lastName: dto.lastName, status: 'PENDING',
        },
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

      await tx.license.create({
        data: {
          tenantId: tenant.id, plan: 'TRIAL', status: 'TRIAL', seats: 3,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.auditLog.create({
        data: { tenantId: tenant.id, userId: user.id, action: 'tenant.register', result: 'success' },
      });

      return { tenant, user };
    });

    return {
      message: 'Compte créé. Vérifiez votre e-mail pour activer votre compte.',
      tenantId: result.tenant.id,
      userId: result.user.id,
    };
  }

  async login(dto: LoginDto, meta: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.deletedAt) throw new UnauthorizedException('Identifiants invalides.');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Compte temporairement verrouillé suite à plusieurs échecs.');
    }

    const passwordValid = await verifySecret(user.passwordHash, dto.password);
    if (!passwordValid) {
      await this.registerFailedAttempt(user.id);
      throw new UnauthorizedException('Identifiants invalides.');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Compte non activé. Vérifiez votre e-mail.');

    await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    return this.issueTokens(user.id, user.tenantId, user.email, meta);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; sessionId: string };
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée. Merci de vous reconnecter.');
    }

    const refreshValid = await verifySecret(session.refreshTokenHash, refreshToken);
    if (!refreshValid) throw new UnauthorizedException('Refresh token invalide.');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable.');

    await this.prisma.session.update({ where: { id: session.id }, data: { lastActivityAt: new Date() } });

    const accessToken = this.jwt.sign(
      { sub: user.id, tenantId: user.tenantId, email: user.email, sessionId: session.id },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: ACCESS_EXPIRES_IN },
    );
    return { accessToken };
  }

  async logout(sessionId: string) {
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    return { message: 'Déconnecté avec succès.' };
  }

  private async issueTokens(userId: string, tenantId: string, email: string, meta: { ipAddress?: string; userAgent?: string }) {
    const sessionId = randomUUID();
    const refreshToken = this.jwt.sign(
      { sub: userId, sessionId },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: `${REFRESH_EXPIRES_DAYS}d` },
    );
    const refreshTokenHash = await hashSecret(refreshToken);

    await this.prisma.session.create({
      data: {
        id: sessionId, userId, refreshTokenHash, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.auditLog.create({
      data: { tenantId, userId, action: 'user.login', result: 'success', ipAddress: meta.ipAddress },
    });

    const accessToken = this.jwt.sign(
      { sub: userId, tenantId, email, sessionId },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: ACCESS_EXPIRES_IN },
    );
    return { accessToken, refreshToken };
  }

  private async registerFailedAttempt(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId }, data: { failedLoginAttempts: { increment: 1 } },
    });
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId }, data: { lockedUntil: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) },
      });
    }
  }
}

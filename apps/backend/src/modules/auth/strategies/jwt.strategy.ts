import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  // Cycle 13_AUTHENTICATION_RBAC.md §16 : Auth -> Tenant -> Statut -> Session -> Permissions
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenant: { include: { license: true } },
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });

    if (!user || user.deletedAt) throw new UnauthorizedException('Utilisateur introuvable');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Compte inactif ou désactivé');
    if (!user.tenant || user.tenant.status === 'SUSPENDED' || user.tenant.status === 'CANCELLED') {
      throw new UnauthorizedException('Accès entreprise suspendu');
    }

    const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée ou révoquée');
    }

    const permissionCodes = user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code));

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      sessionId: session.id,
      permissions: Array.from(new Set(permissionCodes)),
      license: user.tenant.license,
    };
  }
}

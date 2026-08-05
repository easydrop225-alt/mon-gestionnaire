import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformAdminController } from './platform-admin.controller';
import { AccessCodesModule } from '../access-codes/access-codes.module';

@Module({
  imports: [
    AccessCodesModule,
    JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET }),
  ],
  controllers: [PlatformAdminController],
})
export class PlatformAdminModule {}

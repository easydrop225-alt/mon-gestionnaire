import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { AccessCodesModule } from './modules/access-codes/access-codes.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// NOTE : le paiement en ligne (CinetPay : Wave/Orange Money/Visa) est mis de côté
// pour l'instant. Seul le système de codes d'accès (AccessCodesModule) est actif.
// Pour réactiver CinetPay plus tard, réintroduire un PaymentsModule qui appelle
// LicensesService.grantPeriod() exactement comme le fait AccessCodesService.

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    LicensesModule,
    AccessCodesModule,
    // Les modules métier (Produits, Stock, Clients, ...) s'enregistrent ici, phase par phase.
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}

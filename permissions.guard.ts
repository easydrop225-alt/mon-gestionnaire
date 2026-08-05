import { Module } from '@nestjs/common';
import { AccessCodesService } from './access-codes.service';
import { AccessCodesController } from './access-codes.controller';
import { LicensesModule } from '../licenses/licenses.module';

@Module({
  imports: [LicensesModule],
  controllers: [AccessCodesController],
  providers: [AccessCodesService],
  exports: [AccessCodesService],
})
export class AccessCodesModule {}

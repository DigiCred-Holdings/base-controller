import { Module } from '@nestjs/common';
import { SisService } from './sis.service';
import { SisController } from './sis.controller';

@Module({
  controllers: [SisController],
  providers: [SisService],
})
export class SisModule {}

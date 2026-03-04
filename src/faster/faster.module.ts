import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { FileWatcherService } from './services/file-watcher.service';
import { FasterInputParser } from './services/faster-input-parser';
import { FasterProcessingService } from './services/faster-processing.service';
import { FasterExportService } from './services/faster-export.service';
import { FasterPendingService } from './services/faster-pending.service';
import { FasterController } from './faster.controller';
import { AcaPyService } from 'src/services/acapy.service';
import { RedisService } from 'src/services/redis.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    EnrollmentModule,
  ],
  controllers: [FasterController],
  providers: [
    FileWatcherService,
    FasterInputParser,
    FasterProcessingService,
    FasterExportService,
    FasterPendingService,
    AcaPyService,
    RedisService,
  ],
  exports: [FasterPendingService, FasterExportService],
})
export class FasterModule {}

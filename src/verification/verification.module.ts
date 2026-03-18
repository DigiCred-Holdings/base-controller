// verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MetadataModule } from '../metadata/metadata.module'; // Import MetadataModule
import { WorkflowsService } from 'src/workflow/workflows/workflows.service';
import { WorkflowModule } from 'src/workflow/workflow.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { AcaPyService } from 'src/services/acapy.service';
import { FasterModule } from 'src/faster/faster.module';

@Module({
  imports: [HttpModule, ConfigModule, WorkflowModule, MetadataModule, EnrollmentModule, FasterModule],
  controllers: [VerificationController],
  providers: [VerificationService, AcaPyService],
})
export class VerificationModule {}

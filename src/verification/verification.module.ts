// verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MetadataModule } from '../metadata/metadata.module'; // Import MetadataModule

@Module({
  imports: [HttpModule, ConfigModule, MetadataModule], // Add MetadataModule here
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}

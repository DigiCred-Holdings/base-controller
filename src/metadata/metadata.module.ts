import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { AcaPyService } from '../services/acapy.service';

@Module({
  imports: [HttpModule],
  providers: [MetadataService, AcaPyService],
  controllers: [MetadataController],
  exports: [MetadataService],
})
export class MetadataModule {}

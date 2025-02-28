import { Module } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { HttpModule } from '@nestjs/axios';
import { EventsGateway } from 'src/events/events.gateway';
import { RedisService } from '../services/redis.service';
import { EllucianService } from 'src/ellucian/ellucian.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { ConfigModule } from '@nestjs/config';
import { WorkflowModule } from 'src/workflow/workflow.module';
import { AcaPyService } from '../services/acapy.service';


@Module({
  imports: [HttpModule, ConfigModule, WorkflowModule],
  controllers: [ConnectionController],
  providers: [
    ConnectionService,
    RedisService,
    EventsGateway,
    EllucianService,
    MetadataService,
    AcaPyService
  ],
})
export class ConnectionModule {}

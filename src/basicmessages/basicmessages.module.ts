import { Module } from '@nestjs/common';
import { BasicMessagesController } from './basicmessages.controller';
import { BasicMessagesService } from './basicmessages.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EllucianService } from 'src/ellucian/ellucian.service';
import { RedisService } from '../services/redis.service';
import { EllucianController } from 'src/ellucian/ellucian.controller';
import { AcaPyService } from '../services/acapy.service';

@Module({
  imports: [WorkflowModule, ConfigModule, HttpModule],
  controllers: [BasicMessagesController],
  providers: [
    BasicMessagesService,
    RedisService,
    EllucianService,
    EllucianController,
    AcaPyService
  ],
})
export class BasicMessagesModule {}

import { Module } from '@nestjs/common';
import { BasicMessagesController } from './basicmessages.controller';
import { BasicMessagesService } from './basicmessages.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from '../services/redis.service';
import { AcaPyService } from '../services/acapy.service';
import { SisModule } from 'src/sis/sis.module';

@Module({
  imports: [WorkflowModule, ConfigModule, HttpModule, SisModule],
  controllers: [BasicMessagesController],
  providers: [
    BasicMessagesService,
    RedisService,
    AcaPyService
  ],
})
export class BasicMessagesModule {}

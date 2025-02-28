import { Module } from '@nestjs/common';
import { PingController } from './ping.controller';
import { PingService } from './ping.service';
import { AcaPyService } from 'src/services/acapy.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  imports:[HttpModule],
  controllers: [PingController],
  providers: [PingService,AcaPyService],
})
export class PingModule {}

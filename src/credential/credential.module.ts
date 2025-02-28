import { Module } from '@nestjs/common';
import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';
import { HttpModule } from '@nestjs/axios';
import { EventsGateway } from 'src/events/events.gateway';
import { MetadataModule } from '../metadata/metadata.module';
import { ConfigService } from '@nestjs/config';
import { ConnectionService } from '../connection/connection.service';
import { EllucianModule } from '../ellucian/ellucian.module';
import { AcaPyService } from '../services/acapy.service';


@Module({
  imports: [HttpModule, MetadataModule, EllucianModule],
  controllers: [CredentialController],
  providers: [
    CredentialService,
    ConfigService,
    EventsGateway,
    ConnectionService,
    AcaPyService
  ],
})
export class CredentialModule {}

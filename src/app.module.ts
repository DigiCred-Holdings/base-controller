import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectionModule } from './connection/connection.module';
import { CredentialModule } from './credential/credential.module';
import { VerificationModule } from './verification/verification.module';
import { PingModule } from './ping/ping.module';
import { EllucianModule } from './ellucian/ellucian.module';
import { OutOfBandModule } from './out_of_band/out_of_band.module';
import { EventsGateway } from './events/events.gateway';
import { MetadataModule } from './metadata/metadata.module';
import { BasicMessagesModule } from './basicmessages/basicmessages.module';
import { WorkflowModule } from './workflow/workflow.module';
import { PostgresService } from './services/postgres.service';
import { RedisService } from './services/redis.service';
import {
  initDb,
  loadWorkflowsFromFile,
  getWorkflows,
} from '@nas-veridid/workflow-parser';
import * as path from 'path';
import { readFileSync } from 'fs';
import { SvgService } from './svg/svg.service';
import { SvgModule } from './svg/svg.module';
import { SisModule } from './sis/sis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    ConnectionModule,
    OutOfBandModule,
    CredentialModule,
    VerificationModule,
    PingModule,
    EllucianModule,
    BasicMessagesModule,
    WorkflowModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('WORKFLOW_DB_HOST'),
        port: parseInt(configService.get<string>('WORKFLOW_DB_PORT'), 10),
        username: configService.get<string>('WORKFLOW_DB_USER'),
        password: configService.get<string>('WORKFLOW_DB_PASSWORD'),
        database: configService.get<string>('WORKFLOW_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    RouterModule.register([
      {
        path: 'topic',
        module: AppModule,
        children: [
          {
            path: 'ping',
            module: PingModule,
          },
          {
            path: 'connections',
            module: ConnectionModule,
          },
          {
            path: 'out_of_band',
            module: OutOfBandModule,
          },
          {
            path: 'issue_credential',
            module: CredentialModule,
          },
          {
            path: 'present_proof',
            module: VerificationModule,
          },
          {
            path: 'basicmessages',
            module: BasicMessagesModule,
          },
        ],
      },
      {
        path: 'sis',
        module: EllucianModule,
        children: [
          {
            path: '',
            module: EllucianModule,
          },
        ],
      },
      {
        path: 'workflow',
        module: WorkflowModule,
        children: [
          {
            path: '',
            module: WorkflowModule,
          },
        ],
      },
    ]),
    MetadataModule,
    SvgModule,
    SisModule,
  ],
  providers: [
    AppService,
    EventsGateway,
    PostgresService,
    RedisService,
    SvgService,
  ],
  controllers: [AppController],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await initDb();

      // Adding delay after initializing the database
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Load workflows from the JSON file if exists
      const workflowsFilePath = path.join(__dirname, '..', 'workflows.json');
      await loadWorkflowsFromFile(workflowsFilePath);

      // Validate workflows
      const workflowsFromFile = JSON.parse(
        readFileSync(workflowsFilePath, 'utf-8'),
      );
      const workflowsFromDb = await getWorkflows();

      if (workflowsFromFile.length === workflowsFromDb.length) {
        console.log(
          'No.of workflows in workflows.json and No.of workflows in workflow_db table workflows matches! Good ',
        );
      } else {
        console.error(
          'Error loading workflows: Mismatch in number of workflows.',
        );
      }
    } catch (error) {
      console.error('Error initializing workflows:', error.message);
    }
  }
}

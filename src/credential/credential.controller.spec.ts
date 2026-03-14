import { Test, TestingModule } from '@nestjs/testing';
import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../events/events.gateway';
import { MetadataService } from '../metadata/metadata.service';
import { ConnectionService } from '../connection/connection.service';
import { AcaPyService } from '../services/acapy.service';
import { WorkflowService } from '../workflow/workflow.service';
import { SisService } from '../sis/sis.service';

describe('CredentialController', () => {
  let controller: CredentialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialController],
      providers: [
        CredentialService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EventsGateway, useValue: { server: { emit: jest.fn() } } },
        { provide: MetadataService, useValue: { getCredentialTemplate: jest.fn() } },
        { provide: ConnectionService, useValue: { getConnection: jest.fn() } },
        { provide: AcaPyService, useValue: { issueCredential: jest.fn() } },
        { provide: WorkflowService, useValue: { updateWorkflow: jest.fn() } },
        { provide: SisService, useValue: { getStudentId: jest.fn() } },
      ],
    }).compile();

    controller = module.get<CredentialController>(CredentialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

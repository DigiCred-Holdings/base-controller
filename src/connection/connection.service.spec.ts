import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../events/events.gateway';
import { SisService } from '../sis/sis.service';
import { AcaPyService } from '../services/acapy.service';
import { WorkflowService } from '../workflow/workflow.service';

describe('ConnectionService', () => {
  let service: ConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EventsGateway, useValue: { server: { emit: jest.fn() } } },
        { provide: SisService, useValue: { getStudentId: jest.fn() } },
        { provide: AcaPyService, useValue: { createConnection: jest.fn() } },
        { provide: WorkflowService, useValue: { updateWorkflow: jest.fn() } },
      ],
    }).compile();

    service = module.get<ConnectionService>(ConnectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

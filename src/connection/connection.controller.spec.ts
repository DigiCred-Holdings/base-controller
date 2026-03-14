import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../events/events.gateway';
import { SisService } from '../sis/sis.service';
import { AcaPyService } from '../services/acapy.service';
import { WorkflowService } from '../workflow/workflow.service';

describe('ConnectionController', () => {
  let controller: ConnectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectionController],
      providers: [
        ConnectionService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EventsGateway, useValue: { server: { emit: jest.fn() } } },
        { provide: SisService, useValue: { getStudentId: jest.fn() } },
        { provide: AcaPyService, useValue: { createConnection: jest.fn() } },
        { provide: WorkflowService, useValue: { updateWorkflow: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ConnectionController>(ConnectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

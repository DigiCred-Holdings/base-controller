import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { HttpService } from '@nestjs/axios';
import { AcaPyService } from '../services/acapy.service';
import { ConfigService } from '@nestjs/config';
import { MetadataService } from '../metadata/metadata.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { WorkflowService } from '../workflow/workflow.service';
import { FasterPendingService } from '../faster/services/faster-pending.service';
import { FasterExportService } from '../faster/services/faster-export.service';

describe('VerificationService', () => {
  let service: VerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: HttpService, useValue: { get: jest.fn() } },
        { provide: AcaPyService, useValue: { verifyPresentation: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MetadataService, useValue: { getCredentialTemplate: jest.fn() } },
        { provide: EnrollmentService, useValue: { getEnrollment: jest.fn() } },
        { provide: WorkflowService, useValue: { updateWorkflow: jest.fn() } },
        { provide: FasterPendingService, useValue: { getPending: jest.fn() } },
        { provide: FasterExportService, useValue: { exportData: jest.fn() } },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

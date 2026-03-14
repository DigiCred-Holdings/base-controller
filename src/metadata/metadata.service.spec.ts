import { Test, TestingModule } from '@nestjs/testing';
import { MetadataService } from './metadata.service';
import { AcaPyService } from '../services/acapy.service';

describe('MetadataService', () => {
  let service: MetadataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        { provide: AcaPyService, useValue: { getCredentialDefinition: jest.fn() } },
      ],
    }).compile();

    service = module.get<MetadataService>(MetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

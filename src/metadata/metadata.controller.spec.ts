import { Test, TestingModule } from '@nestjs/testing';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { ConfigService } from '@nestjs/config';
import { AcaPyService } from '../services/acapy.service';

describe('MetadataController', () => {
  let controller: MetadataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetadataController],
      providers: [
        MetadataService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AcaPyService, useValue: { getCredentialDefinition: jest.fn() } },
      ],
    }).compile();

    controller = module.get<MetadataController>(MetadataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

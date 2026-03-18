import { Test, TestingModule } from '@nestjs/testing';
import { SvgService } from './svg.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('SvgService', () => {
  let service: SvgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SvgService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: HttpService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<SvgService>(SvgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

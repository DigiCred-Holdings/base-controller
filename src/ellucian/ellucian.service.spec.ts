import { Test, TestingModule } from '@nestjs/testing';
import { EllucianService } from './ellucian.service';

describe('EllucianService', () => {
  let service: EllucianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EllucianService],
    }).compile();

    service = module.get<EllucianService>(EllucianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

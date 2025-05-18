import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingService } from './job-posting.service';

describe('JobPostingService', () => {
  let service: JobPostingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobPostingService],
    }).compile();

    service = module.get<JobPostingService>(JobPostingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

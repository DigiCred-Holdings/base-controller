import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingController } from './job-posting.controller';

describe('JobPostingController', () => {
  let controller: JobPostingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobPostingController],
    }).compile();

    controller = module.get<JobPostingController>(JobPostingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

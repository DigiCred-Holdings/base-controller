import { Test, TestingModule } from '@nestjs/testing';
import { EllucianController } from './ellucian.controller';

describe('EllucianController', () => {
  let controller: EllucianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EllucianController],
    }).compile();

    controller = module.get<EllucianController>(EllucianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SvgController } from './svg.controller';
import { SvgService } from './svg.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('SvgController', () => {
  let controller: SvgController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SvgController],
      providers: [
        SvgService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: HttpService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SvgController>(SvgController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

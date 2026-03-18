import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FasterProcessingService } from './services/faster-processing.service';
import { FasterBatchResult } from './interfaces/faster-request.interface';

@ApiTags('FASTER Export')
@Controller()
export class FasterController {
  constructor(private readonly processingService: FasterProcessingService) {}

  @Post('process')
  async processManual(
    @Body() body: { content: string; filename: string },
  ): Promise<{ status: string; result: FasterBatchResult }> {
    const result = await this.processingService.processInputFile(body.content, body.filename);
    return {
      status: 'processed',
      result,
    };
  }

  @Get('status')
  getStatus(): { status: string } {
    return { status: 'FASTER export service is running' };
  }
}

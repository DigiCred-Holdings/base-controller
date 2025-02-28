import { Controller, Res, Get } from '@nestjs/common';
import { SvgService } from './svg.service';
import { Response } from 'express';

@Controller('svg')
export class SvgController {
  constructor(private readonly transcriptService: SvgService) {}
  @Get('generate')
  async generateTranscript(@Res() res: Response) {
    const svg = await this.transcriptService.generateTranscript();
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
}

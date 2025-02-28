// verification.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { VerificationService } from './verification.service';

@Controller()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('/')
  async getHello(
    @Body() data: any,
    @Res() response: Response,
  ): Promise<Response> {
    console.log('************* Verification controller ***************  /n');
    console.log(data);
    if (data?.state === 'request_sent') {
      await this.verificationService.verify(data);
    } else if (data?.state === 'verified') {
      await this.verificationService.handleVerifiedState(data);
    }else if (data?.state === 'abandoned') {
      await this.verificationService.handleAbandonedState(data);
    }
    return response.status(HttpStatus.OK).send('OK');
  }
}

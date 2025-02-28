import {
    Controller,
    Post,
    Body,
    Res,
    HttpStatus,
  } from '@nestjs/common';
  import { Response } from 'express';
  import { OutOfBandService } from './out_of_band.service';
  
  @Controller() 
  export class OutOfBandController {
    constructor(private readonly outOfBandService: OutOfBandService) {}
  
    @Post('/')
    async handleOutOfBand(@Body() data: any, @Res() response: Response): Promise<Response> {
      console.log('************* OOB Connection controller ***************  /n');
      console.log('Handling Out of Band request', data);
      // if (data.state === 'await-response') {
      //   console.log("Checkpoint OOB data state==await-response")
      // }
      if (data.state === 'active') {
        console.log("Checkpoint OOB data state==active")
        await this.outOfBandService.performOutOfBandTask(data);
      }
      return response.status(HttpStatus.OK).send('OutOfBand OK');
    }
  }
  
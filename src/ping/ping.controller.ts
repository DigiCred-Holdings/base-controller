import { HttpService } from '@nestjs/axios';
import { Controller, Get, Res, Body, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import { lastValueFrom, map } from 'rxjs';
import { PingService } from './ping.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
export class PingController {
  constructor(private readonly pingservice: PingService) {}
  logger: any;
  @Post('/')
  ping(@Body() data: any, @Res() response: Response): Response {
    console.log('Ping controller', data);
    return response.status(HttpStatus.OK).send('OK');
  }

  @Get('/connections')
  @ApiResponse({ status: 200, description: 'The request has succeeded.' })
  async pingGet() {
    let result:any = await this.pingservice.getConnections();
    return result;

  }
  getRequestConfig(): AxiosRequestConfig<any> {
    throw new Error('Method not implemented.');
  }
}

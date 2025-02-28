import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ConnectionService } from './connection.service';

@Controller()
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Post('/')
  async handleConnection(
    @Body() connectionData: any,
    @Res() response: Response,
  ): Promise<Response> {
    console.log('************* Connection controller ***************');
    console.log(connectionData);

    try {
      await this.connectionService.handleConnection(connectionData);
      return response
        .status(HttpStatus.OK)
        .send('Connection request handled successfully');
    } catch (error) {
      console.error('Error handling connection request:', error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to handle connection request');
    }
  }
}

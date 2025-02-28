import {
  Controller,
  Put,
  Body,
  Param,
  Res,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
@Controller('metadata')
export class MetadataController {
  constructor(
    private readonly metadataService: MetadataService,
    private readonly configService: ConfigService,
  ) {}

  @Put(':connId')
  async updateMetadata(
    @Param('connId') connId: string,
    @Body() metadata: any,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.metadataService.updateConnectionMetadata(connId, metadata);
      return response
        .status(HttpStatus.OK)
        .send('Metadata updated successfully');
    } catch (error) {
      console.error('Error updating metadata:', error.message);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to update metadata');
    }
  }

  @Get('/transcript-credential-definition-id')
  getId(@Res() response: Response): Response {
    const transcriptCredentialDefinitionId = this.configService.get<string>(
      'TRANSCRIPT_CREDENTIAL_DEFINITION_ID',
    );
    if (!transcriptCredentialDefinitionId) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Transcript Credential Definition ID not found',
      });
    }
    return response.status(HttpStatus.OK).json({
      transcriptCredentialDefinitionId,
    });
  }
}

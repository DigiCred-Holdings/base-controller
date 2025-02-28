import { Injectable } from '@nestjs/common';
import { AcaPyService } from '../services/acapy.service';

@Injectable()
export class MetadataService {
  constructor(
    private readonly acapyService: AcaPyService,
  ) {}

  async updateConnectionMetadata(connId: string, metadata: any): Promise<void> {
    // Fetch current metadata
    const currentMetadata = await this.acapyService.fetchCurrentMetadata(connId);

    // Initialize results if not present
    if (!currentMetadata.results) {
      currentMetadata.results = {};
    }

    // Check if any of the specific fields are missing
    const isAnyFieldMissing = !currentMetadata.results.student_id ||
                              !currentMetadata.results.first_name ||
                              !currentMetadata.results.last_name ||
                              !currentMetadata.results.expiration;

    // Update all fields if any field is missing
    if (isAnyFieldMissing) {
      currentMetadata.results = {
        ...currentMetadata.results,
        student_id: metadata.student_id,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        expiration: metadata.expiration,
      };

      console.log(
        `Updating metadata for connection: ${connId} with data:`,
        currentMetadata.results,
      );

      // Update metadata using AcaPyService
      await this.acapyService.updateMetadata(connId, currentMetadata.results);
    } else {
      console.log(`Metadata for connection: ${connId} is already complete. No update needed.`);
    }
  }
}

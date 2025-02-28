import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../events/events.gateway';
import { EllucianService } from '../ellucian/ellucian.service';
import { AcaPyService } from '../services/acapy.service';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
    private readonly ellucianService: EllucianService,
    private readonly acapyService: AcaPyService,
  ) {}

  async handleConnection(connectionData: any): Promise<void> {
    if (connectionData.state === 'request') {
      console.log('Current status is request.');
      this.emitEvent(connectionData, null, null);
    } else if (connectionData.state === 'active') {
      console.log('Connection is active.');
      await this.handleActiveState(connectionData);
    }
  }

  private async handleActiveState(connectionData: any) {
    const alias = connectionData.alias;
    if (!alias) {
      console.error('Alias is undefined');
      await this.acapyService.sendWelcomeMessage(connectionData);
      return;
    }

    const studentNumber = this.extractStudentNumber(alias);
    if (!studentNumber) {
      console.error('Student number is undefined');
      await this.acapyService.sendWelcomeMessage(connectionData);
      return;
    }

    console.log('Extracted studentNumber:', studentNumber);

    let attributes: any;

    try {
      const studentIdCred =
        await this.ellucianService.getStudentIdCred(studentNumber);
      console.log('studentIdCred at ConnectionController', studentIdCred);

      if (studentIdCred) {
        attributes = this.createAttributes(studentIdCred);
        const credentialOfferBody = {
          "auto_issue": true,
          "auto_remove": false,
          "connection_id": connectionData.connection_id,
          "cred_def_id": this.configService.get<string>('STUDENTID_CREDENTIAL_DEFINITION_ID'),
          "credential_preview": {
            "@type": "issue-credential/1.0/credential-preview",
            "attributes": attributes
          }
        }
        this.acapyService.sendCredOffer(credentialOfferBody);
      } else {
        console.error(
          'Unable to obtain Student info from Student Information System',
        );
        // attributes = this.createFallbackAttributes(alias);
        this.acapyService.sendWelcomeMessage(connectionData);
      }
    } catch (error) {
      console.error('Error retrieving studentIdCred:', error);
      // attributes = this.createFallbackAttributes(alias);
      this.acapyService.sendWelcomeMessage(connectionData);
    }

    this.emitEvent(
      connectionData,
      attributes,
      this.configService.get<string>('STUDENTID_CREDENTIAL_DEFINITION_ID'),
    );
    await this.acapyService.sendWelcomeMessage(connectionData);
  }

  private extractStudentNumber(alias: string): string | null {
    const parts = alias.split(' -studentID- ');
    return parts.length > 1 ? parts[1] : null;
  }

  private createAttributes(studentIdCred: any): any[] {
    return [
      { name: 'Last', value: studentIdCred.lastName ?? '' },
      { name: 'School', value: this.configService.get<string>('SCHOOL') ?? '' },
      {
        name: 'Expiration',
        value: this.configService.get<string>('STUDENTID_EXPIRATION') ?? '',
      },
      { name: 'First', value: studentIdCred.firstName ?? '' },
      { name: 'StudentID', value: studentIdCred.studentsId ?? '' },
      { name: 'Middle', value: studentIdCred.middleName ?? '' },
    ];
  }

  // private createFallbackAttributes(alias: string): any[] {
  //   return [
  //     { name: 'Last', value: alias ?? '' },
  //     { name: 'School', value: this.configService.get<string>('SCHOOL') ?? '' },
  //     {
  //       name: 'Expiration',
  //       value: this.configService.get<string>('STUDENTID_EXPIRATION') ?? '',
  //     },
  //     { name: 'First', value: alias ?? '' },
  //     { name: 'StudentID', value: alias ?? '' },
  //     { name: 'Middle', value: alias ?? '' },
  //   ];
  // }

  private emitEvent(connectionData: any, attributes: any, credDefId: string) {
    this.eventsGateway.sendEventUpdate({
      attributes: attributes,
      timestamp: new Date(),
      details: connectionData,
      cred_def_id: credDefId,
    });
  }
}

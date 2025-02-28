import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetadataService } from '../metadata/metadata.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom, firstValueFrom, map } from 'rxjs';
import { parse, getWorkflowInstance, updateWorkflowInstanceByID } from '@nas-veridid/workflow-parser';


@Injectable()
export class VerificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly metadataService: MetadataService,
  ) { }

  // Helper method to send a message
  private async sendMessage(connectionId: string, messageDisplayed: string): Promise<void> {
    const messageUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/connections/${connectionId}/send-message`;
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'X-API-KEY': this.configService.get<string>('API_KEY'),
      },
    };
    const messageContent = { content: messageDisplayed };

    try {
      await lastValueFrom(
        this.httpService.post(messageUrl, messageContent, requestConfig).pipe(map((resp) => resp.data))
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }


  async verify(connectionData: any): Promise<boolean> {
    const WORKFLOW_ID = 'NewStudentOrientation';
    const CURRENT_STATE = 'verifyID'
    const connectionId = connectionData.connection_id;
    console.log("Verfication data from request-sent state", connectionData);
    //Add threadId into workflow instance ID 
    const threadId = connectionData?.thread_id;
    const response = await getWorkflowInstance(`${connectionId}`, `${WORKFLOW_ID}`)
    console.log("response from verify section", response);
    const instanceID = response?.instanceID;
    const instance = {
      instanceID: `${instanceID}`,
      workflowID: `${WORKFLOW_ID}`,
      connectionID: `${connectionId}`,
      currentState: `${CURRENT_STATE}`,
      stateData: { "threadId": `${threadId}` }
    }
    await updateWorkflowInstanceByID(`${instanceID}`, instance)
    //------------------------------------------------------------------


    const send_message =
      `${this.configService.get<string>('API_BASE_URL')}:8032/connections/` +
      connectionId +
      '/send-message';
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'X-API-KEY': this.configService.get<string>('API_KEY'),
      },
    };

    console.log('Call REST ', send_message, ' Options ', requestConfig);

    let messageContent: string | undefined;
    try {
      const verificationRecord = await this.fetchVerificationRecord(
        connectionData.presentation_exchange_id,
      );

      const schemaName =
        verificationRecord?.presentation_request?.requested_attributes
          ?.studentInfo?.restrictions?.[0]?.schema_name;

      if (schemaName) {
        if (schemaName === this.configService.get<string>('ID_SCHEMA_NAME')) {
          messageContent = this.configService.get<string>(
            'REQUEST_STUDENT_ID_VERIFICATION_MESSAGE',
          );
        } else if (
          schemaName ===
          this.configService.get<string>('TRANSCRIPT_SCHEMA_NAME')
        ) {
          messageContent = this.configService.get<string>(
            'REQUEST_STUDENT_TRANSCRIPT_VERIFICATION_MESSAGE',
          );
        } else {
          console.log('Schema name does not match student ID or transcript.');
        }
      } else {
        console.error('Schema name is undefined or empty.');
      }
    } catch (error) {
      console.error('Error fetching verification record:', error.message);
    }

    if (messageContent) {
     await lastValueFrom(
        this.httpService
          .post(send_message, { content: messageContent }, requestConfig)
          .pipe(map((resp) => resp.data)),
      );
    }

    return true;
  }

  async handleVerifiedState(data: any): Promise<void> {
    console.log(
      'Fetching detailed record using presentation_exchange_id:',
      data.presentation_exchange_id,
    );

    // Fetch the full verification record from ACA-Py using presentation_exchange_id
    const verificationRecord = await this.fetchVerificationRecord(
      data.presentation_exchange_id,
    );

    const studentInfo =
      verificationRecord?.presentation?.requested_proof?.revealed_attr_groups
        ?.studentInfo?.values;

    if (studentInfo) {
      const First = studentInfo?.First?.raw;
      const Last = studentInfo?.Last?.raw;
      const StudentID = studentInfo?.StudentID?.raw;

      if (First && Last && StudentID) {
        // Update connection metadata when verification is acknowledged
        await this.metadataService.updateConnectionMetadata(
          data.connection_id,
          {
            student_id: StudentID,
            first_name: First,
            last_name: Last,
          },
        );
        console.log('Metadata updated successfully for verified state.');
      } else {
        console.error(
          'First, Last, or StudentID not found in verification attributes.',
        );
      }
    } else {
      console.error('Verification attributes are undefined.');
    }
    let resultOfParse: any;
    const WORKFLOW_ID = 'NewStudentOrientation';
    const ACTIONID_VERFIED = 'verified';
    const connectionId = data?.connection_id;
    const threadId = data?.thread_id;
    console.log("verified Data from verified state: ", data)
    const response = await getWorkflowInstance(`${connectionId}`, `${WORKFLOW_ID}`)
    console.log("response from verified state", response);

    if (response && response.stateData?.threadId === `${threadId}`) {
      // invoke parse here with new update
      const action = {
        workflowID: `${WORKFLOW_ID}`,
        actionID: `${ACTIONID_VERFIED}`,
        data: {},
      };
      try {
        resultOfParse = await parse(connectionId, action);
      } catch (error) {
        console.error('Error parsing workflow:', error.message);
      }
      // Send workflow response message as it is
      await this.sendMessage(connectionId, JSON.stringify(resultOfParse));
    }
  }

  async handleAbandonedState(connectionData: any): Promise<void> {
    const WORKFLOW_ID = 'NewStudentOrientation';
    const connectionId = connectionData?.connection_id;
    const threadId = connectionData?.thread_id;
    const response = await getWorkflowInstance(`${connectionId}`, `${WORKFLOW_ID}`)
    console.log("response from abandoned state", response);

    if (response && response.stateData?.threadId === `${threadId}`) {
      // invoke parse here with new update
      const message = this.configService.get<string>('REQUEST_STUDENT_ID_VERIFICATION_MESSAGE')
      await this.sendMessage(connectionId, message);
    }
  }

  private async fetchVerificationRecord(
    presentationExchangeId: string,
  ): Promise<any> {
    const apiUrl = `${this.configService.get<string>('SWAGGER_API_URL')}:8032/present-proof/records/${presentationExchangeId}`;

    const headers = {
      accept: 'application/json',
      'X-API-KEY': this.configService.get<string>('API_KEY'),
      Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
    };

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(apiUrl, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching verification record:', error);
    }
  }
}

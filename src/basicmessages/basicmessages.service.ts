import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from '@nas-veridid/workflow-parser';
import { AcaPyService } from '../services/acapy.service';
import { EllucianController } from 'src/ellucian/ellucian.controller';

@Injectable()
export class BasicMessagesService {

  constructor(
    private readonly configService: ConfigService,
    private readonly acapyService: AcaPyService,
    private readonly ellucianController: EllucianController
  ) { }

  // Method to validate JSON format
  async isValidJsonFormat(content: string): Promise<boolean> {
    try {
      const parsedContent = JSON.parse(content);
      return typeof parsedContent.workflowID === 'string' &&
        typeof parsedContent.actionID === 'string' &&
        typeof parsedContent.data === 'object';
    } catch (e) {
      return false;
    }
  }

  // Main method to process messages
  async processMessage(messageData: any): Promise<void> {
    const connectionId: string = messageData.connection_id;

    // Handle JSON format workflow messages
    if (await this.isValidJsonFormat(messageData.content)) {
      let response: any;
      const parsedContent = JSON.parse(messageData.content);
      const action = {
        workflowID: parsedContent.workflowID,
        actionID: parsedContent.actionID,
        data: parsedContent.data,
      };

      try {
        response = await parse(connectionId, action);
      } catch (error) {
        console.error('Error parsing workflow:', error.message);
        return;
      }

      if (response.displayData) {
        const hasAgentType = response.displayData.some((item: any) => item.type === 'agent');
        if (hasAgentType) {
          const agentItems = response.displayData.filter((item: any) => item.type === 'agent');
          for (const agentItem of agentItems) {
            if (agentItem.process === 'verification') {
              await this.acapyService.sendProofRequest(connectionId, agentItem.data);
            } else if (agentItem.process === 'issuance') {
              if (agentItem.data.cred_def_id === this.configService.get<string>('NEW_ORIENTATION_CRED_DEF_ID')) {
                //get metadata of the connection
                const result = await this.acapyService.getMetadataByConnectionId(connectionId);
                // get data for send offer
                const credentialOfferBody = {
                  "auto_issue": true,
                  "connection_id": connectionId,
                  "cred_def_id": agentItem.data.cred_def_id,
                  "credential_preview": {
                    "@type": "issue-credential/1.0/credential-preview",
                    "attributes": [
                      {
                        "name": "Title",
                        "value": agentItem.data.title
                      },
                      {
                        "name": "Student ID No",
                        "value": result.student_id
                      },
                      {
                        "name": "Last Name",
                        "value": result.last_name
                      },
                      {
                        "name": "First Name",
                        "value": result.first_name
                      },
                      {
                        "name": "Session",
                        "value": agentItem.data.session
                      }
                    ]
                  }
                }
                this.acapyService.sendCredOffer(credentialOfferBody);
              }
            } else if (agentItem.process === 'connection') {
              if (agentItem.data?.actionRequested === 'getTranscript') {
                //get metadata by connection id 
                const metadata = await this.acapyService.getMetadataByConnectionId(connectionId);
                if (metadata.student_id) {
                  //send basic message while waiting
                  await this.acapyService.sendMessage(connectionId, JSON.stringify(response));
                  //get student transcript info from Ellucian
                  let studentTranscripts;
                  try {
                    studentTranscripts = await this.ellucianController.getStudentInfo(metadata.student_id);
                  } catch (error: any) {
                    console.log("Error retrieving from Ellucian", error);
                    //invoke workflow parse
                    const action = { workflowID: 'RequestTranscript', actionID: 'metadataNotFound', data: {} };
                    await this.invokeWorkflowParser(connectionId, action);
                    return;
                  }
                  if (!studentTranscripts?.courseTranscript || studentTranscripts?.courseTranscript.length < 1) {
                    console.log("Unable to retrieve any transcript data ");
                    const action = { workflowID: 'RequestTranscript', actionID: 'metadataNotFound', data: {} };
                    await this.invokeWorkflowParser(connectionId, action);
                    return;
                  }
                  // send transcript offer to student
                  const courseTranscripts = JSON.stringify(studentTranscripts?.courseTranscript);
                  const credentialOfferBody = {
                    "auto_issue": true,
                    "connection_id": connectionId,
                    "cred_def_id": `${this.configService.get<string>('TRANSCRIPT_CREDENTIAL_DEFINITION_ID')}`,
                    "credential_preview": {
                      "@type": "issue-credential/1.0/credential-preview",
                      "attributes": [
                        {
                          "name": "Last",
                          "value": `${studentTranscripts.studentId[0]?.lastName}`
                        },

                        {
                          "name": "First",
                          "value": `${studentTranscripts.studentId[0]?.firstName}`
                        },
                        {
                          "name": "Expiration",
                          "value": `${this.configService.get<string>('STUDENTID_EXPIRATION')}`
                        },
                        {
                          "name": "StudentID",
                          "value": `${studentTranscripts.studentId[0]?.studentID}`
                        },
                        {
                          "name": "Middle",
                          "value": `${studentTranscripts.studentId[0]?.middleName}`
                        },
                        {
                          "name": "Transcript",
                          "value": `${courseTranscripts}`
                        },
                        {
                          "name": "School",
                          "value": `${this.configService.get<string>('SCHOOL')}`
                        },
                        {
                          "name": "GPA",
                          "value": `${studentTranscripts.studentCumulativeTranscript[0].cumulativeGradePointAverage}`
                        },

                      ]
                    }
                  }
                  try {
                    
                     this.acapyService.sendCredOffer(credentialOfferBody);
                  } catch (error: any) {
                    console.log("Error sending transcripts", error);
                    const action = { workflowID: 'RequestTranscript', actionID: 'metadataNotFound', data: {} };
                    await this.invokeWorkflowParser(connectionId, action);
                    return;
                  }
                  //invoke workflow parse
                  const action = { workflowID: 'RequestTranscript', actionID: 'metadataFound', data: {} };
                  await this.invokeWorkflowParser(connectionId, action);
                  return;
                } else {
                  console.log("No Student Metadata");
                  //invoke workflow parse
                  const action = { workflowID: 'RequestTranscript', actionID: 'metadataNotFound', data: {} };
                  await this.invokeWorkflowParser(connectionId, action);
                  return;
                }
              }
            }
          }
          // Filter out the content with type 'agent'
          const filteredDisplayData = response.displayData.filter((item: any) => item.type !== 'agent');
          // Construct modified response
          const modifiedResponse = { ...response, displayData: filteredDisplayData };
          // Send workflow response message with filtered displayData
          await this.acapyService.sendMessage(connectionId, JSON.stringify(modifiedResponse));
        } else {
          // Send workflow response message as it is
          await this.acapyService.sendMessage(connectionId, JSON.stringify(response));
        }
      } else {
        // Default message if no displayData
        await this.acapyService.sendMessage(connectionId, "Action Menu Feature Not Available For this Connection!");
      }
    }

    // Handle home menu (root menu) requests
    if (messageData.content === ':menu') {
      const action = { workflowID: 'root-menu', actionID: '', data: {} };
      let response: any;

      try {
        response = await parse(connectionId, action);
      } catch (error) {
        console.error('Error parsing workflow:', error.message);
        return;
      }
      if (response.displayData) {
        await this.acapyService.sendMessage(connectionId, JSON.stringify(response));
      } else {
        await this.acapyService.sendMessage(connectionId, "Action Menu Feature Not Available For this Connection!");
      }
    }
  }

  private async invokeWorkflowParser(connectionId: string, action: object): Promise<void> {
    let response: any;

    try {
      response = await parse(connectionId, action);
    } catch (error) {
      console.error('Error parsing workflow:', error.message);
      return;
    }
    if (response.displayData) {
      await this.acapyService.sendMessage(connectionId, JSON.stringify(response));
    } else {
      await this.acapyService.sendMessage(connectionId, "Action Menu Feature Not Available For this Connection!");
    }
  }
}

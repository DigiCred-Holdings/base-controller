// src/workflow/workflow.controller.ts
import { Controller, Post, Body} from '@nestjs/common';
import { ApiTags, ApiResponse,ApiBody } from '@nestjs/swagger';
import { parse } from '@nas-veridid/workflow-parser';

@ApiTags('Workflow')
@Controller()
export class WorkflowController {
  @Post('parse')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        connectionID: {
          type: 'string',
          format: 'uuid',
          example: 'a123e456-78d9-0abc-def1-234567890abc',
        },
        action: {
          type: 'object',
          properties: {
            workflowID: {
              type: 'string',
              example: 'root-menu',
            },
            actionID: {
              type: 'string',
              example: 'selectNewStudentOrientation',
            },
            data: {
              type: 'object',
              additionalProperties: true,
              example: {
                key: 'value',
              },
            },
          },
          required: ['workflowID', 'actionID'],
        },
      },
      required: ['connectionID', 'action'],
    },
  })
  @ApiResponse({ status: 200, description: 'Return workflow instance.' })

  async parseAction(
    @Body() body: { connectionID: string; action: { workflowID: string; actionID: string; data?: any } }
  ) {
    const { connectionID, action } = body;
    try {
      const displayData = await parse(connectionID, action);
      return { success: true, displayData };
    } catch (error) {
      console.error('Error parsing workflow:', error.message);
      return { success: false, error: error.message };
    }
  }
}

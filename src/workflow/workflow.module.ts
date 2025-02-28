import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { PostgresService } from '../services/postgres.service';

@Module({
  controllers: [WorkflowController],
  providers: [PostgresService],

})
export class WorkflowModule {}

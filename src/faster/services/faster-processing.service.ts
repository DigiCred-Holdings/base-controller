import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { AcaPyService } from 'src/services/acapy.service';
import { FasterInputParser } from './faster-input-parser';
import { FasterExportService } from './faster-export.service';
import { FasterPendingService } from './faster-pending.service';
import {
  FasterBatchRequest,
  FasterBatchResult,
  FasterStudentRequest,
  FasterError,
  FasterErrorCode,
} from '../interfaces/faster-request.interface';

@Injectable()
export class FasterProcessingService {
  private readonly logger = new Logger(FasterProcessingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly enrollmentService: EnrollmentService,
    private readonly acapyService: AcaPyService,
    private readonly inputParser: FasterInputParser,
    private readonly exportService: FasterExportService,
    private readonly pendingService: FasterPendingService,
  ) {}

  /**
   * Process an incoming FASTER request file.
   * Parses the file, partitions students, exports what's ready, and queues the rest.
   */
  async processInputFile(content: string, filename: string): Promise<FasterBatchResult> {
    const batchRequest = this.inputParser.parseBatchRequest(content, filename);
    return this.processBatchRequest(batchRequest);
  }

  /**
   * Process a parsed batch request.
   * 1. Look up enrollments for all student numbers
   * 2. Partition into: readyToExport, pendingWorkflow, errors
   * 3. Export ready enrollments as a batch file
   * 4. Send proof requests for pending students
   * 5. Write error file for any failures
   */
  async processBatchRequest(batchRequest: FasterBatchRequest): Promise<FasterBatchResult> {
    const { sourceFilename, students, errors: parseErrors } = batchRequest;
    const errors: FasterError[] = [...parseErrors];
    const readyToExport: Enrollment[] = [];
    const pendingWorkflow: FasterStudentRequest[] = [];
    const studentsNeedingWorkflow: FasterStudentRequest[] = [];

    if (students.length === 0) {
      this.logger.warn(`No valid students in request file ${sourceFilename}`);
      const errorFilePath = this.exportService.writeErrorFile(errors, sourceFilename);
      return { sourceFilename, readyToExport, pendingWorkflow, errors, errorFilePath };
    }

    // Step 1: Batch lookup enrollments
    const studentNumbers = students.map(s => s.studentNumber);
    const enrollments = await this.enrollmentService.findRecentByStudentNumbers(studentNumbers);
    const enrollmentMap = new Map<string, Enrollment>();
    for (const enrollment of enrollments) {
      enrollmentMap.set(enrollment.student_number, enrollment);
    }

    // Step 2: Partition students
    for (const student of students) {
      const enrollment = enrollmentMap.get(student.studentNumber);
      if (enrollment) {
        readyToExport.push(enrollment);
      } else {
        studentsNeedingWorkflow.push(student);
      }
    }

    this.logger.log(
      `Batch ${sourceFilename}: ${readyToExport.length} ready, ` +
      `${pendingWorkflow.length} pending, ${errors.length} errors`,
    );

    // Step 3: Export ready enrollments as batch
    let exportedFilePath: string | undefined;
    if (readyToExport.length > 0) {
      try {
        exportedFilePath = this.exportService.exportBatch(readyToExport, sourceFilename);
      } catch (err) {
        errors.push(this.createError(
          FasterErrorCode.EXPORT_WRITE_FAILED,
          `Failed to write batch export: ${(err as Error).message}`,
          '',
        ));
      }
    }

    // Step 4: Handle pending students (send proof requests)
    for (const student of studentsNeedingWorkflow) {
      const wasQueued = await this.handlePendingStudent(student, sourceFilename, errors);
      if (wasQueued) {
        pendingWorkflow.push(student);
      }
    }

    // Step 5: Write error file if any errors
    let errorFilePath: string | undefined;
    if (errors.length > 0) {
      try {
        errorFilePath = this.exportService.writeErrorFile(errors, sourceFilename) ?? undefined;
      } catch (err) {
        this.logger.error(`Failed to write error file: ${(err as Error).message}`);
      }
    }

    return { sourceFilename, readyToExport, pendingWorkflow, errors, exportedFilePath, errorFilePath };
  }

  /**
   * Handle a student that has no enrollment:
   * 1. Find their active connection by alias
   * 2. Send a proof request for their transcript
   * 3. Store as pending in Redis
   */
  private async handlePendingStudent(
    student: FasterStudentRequest,
    sourceFilename: string,
    errors: FasterError[],
  ): Promise<boolean> {
    const { studentNumber } = student;

    // Find connection by alias
    const connectionId = await this.findConnectionByStudentNumber(studentNumber);
    if (!connectionId) {
      errors.push(this.createError(
        FasterErrorCode.CONNECTION_NOT_FOUND,
        `No active connection found for student ${studentNumber}`,
        studentNumber,
      ));
      return false;
    }

    // Send proof request
    try {
      const schemaName = this.configService.get<string>('TRANSCRIPT_SCHEMA_NAME', '');
      await this.sendTranscriptProofRequest(connectionId, schemaName);
    } catch (err) {
      errors.push(this.createError(
        FasterErrorCode.PROOF_REQUEST_FAILED,
        `Proof request failed for student ${studentNumber}: ${(err as Error).message}`,
        studentNumber,
      ));
      return false;
    }

    // Store pending request
    await this.pendingService.addPendingRequest(studentNumber, {
      studentNumber,
      connectionId,
      sourceFilename,
      requestedAt: new Date().toISOString(),
    });
    return true;
  }

  /**
   * Search all connections for one whose alias contains the given student number.
   * Alias format: "<name> -studentID- <studentNumber>"
   */
  private async findConnectionByStudentNumber(studentNumber: string): Promise<string | null> {
    try {
      const response = await this.acapyService.getConnections();
      const connections: Array<{ alias?: string; state?: string; connection_id?: string }> =
        response?.results || [];

      for (const conn of connections) {
        if (conn.alias && conn.state === 'active') {
          const extractedId = this.extractStudentNumber(conn.alias);
          if (extractedId === studentNumber) {
            return conn.connection_id ?? null;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error searching connections: ${(error as Error).message}`);
    }
    return null;
  }

  /**
   * Extract student number from connection alias.
   * Same pattern used in action.extension.ts and connection.service.ts.
   */
  private extractStudentNumber(alias: string): string | null {
    const parts = alias.split(' -studentID- ');
    return parts.length > 1 ? parts[1].trim() : null;
  }

  /**
   * Send a transcript proof request to a student's wallet.
   * Mirrors pattern from ExtendedAction.sendHSTranscriptProofRequest2().
   */
  private async sendTranscriptProofRequest(connectionId: string, schemaName: string): Promise<void> {
    const schema = schemaName.split(':');
    const schemaShortName = schema.length > 2 ? schema[2] : schemaName;
    const proofRequest = {
      connection_id: connectionId,
      auto_verify: true,
      auto_remove: false,
      comment: 'FASTER Transcript Export Proof Request',
      trace: false,
      presentation_request: {
        indy: {
          name: 'proof-request',
          nonce: '1234567890',
          version: '1.0',
          requested_attributes: {
            studentInfo: {
              names: [
                'studentBirthDate',
                'studentFullName',
                'studentInfo',
                'studentNumber',
                'terms',
                'transcript',
              ],
              restrictions: [{ schema_name: schemaShortName }],
            },
          },
          requested_predicates: {},
        },
      },
    };
    await this.acapyService.sendProofRequest2(connectionId, proofRequest);
  }

  private createError(code: FasterErrorCode, message: string, studentNumber: string): FasterError {
    return {
      code,
      message,
      studentNumber,
      timestamp: new Date().toISOString(),
    };
  }
}

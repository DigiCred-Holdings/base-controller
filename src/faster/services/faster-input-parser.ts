import { Injectable, Logger } from '@nestjs/common';
import {
  FasterBatchRequest,
  FasterStudentRequest,
  FasterRequestType,
  FasterError,
  FasterErrorCode,
} from '../interfaces/faster-request.interface';

/** Minimum line length required for a valid FASTER record */
const MIN_LINE_LENGTH = 13;

/** Known FASTER record type prefixes */
const RECORD_TYPE_PREFIXES: Record<string, FasterRequestType> = {
  S: FasterRequestType.SECONDARY,
  P: FasterRequestType.POSTSECONDARY,
  I: FasterRequestType.INTERDISTRICT,
};

@Injectable()
export class FasterInputParser {
  private readonly logger = new Logger(FasterInputParser.name);

  /**
   * Parse a FASTER-format fixed-length request file.
   * Returns a batch request containing all successfully parsed student requests
   * and any errors encountered during parsing.
   *
   * Field positions are configurable -- initially uses placeholder positions.
   * TODO: Fill in exact field positions from FASTER spec.
   */
  parseBatchRequest(content: string, sourceFilename: string): FasterBatchRequest {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const students: FasterStudentRequest[] = [];
    const errors: FasterError[] = [];
    let requestType: FasterRequestType = FasterRequestType.UNKNOWN;

    if (lines.length === 0) {
      errors.push(this.createError(
        FasterErrorCode.INVALID_REQUEST,
        'Input file is empty or contains no valid lines',
        '',
      ));
      return { sourceFilename, requestType, students, errors, parsedAt: new Date() };
    }

    for (const line of lines) {
      const result = this.parseLine(line);

      if ('error' in result) {
        errors.push(result.error);
        continue;
      }

      // Determine request type from the first successfully parsed record
      if (requestType === FasterRequestType.UNKNOWN && result.student.recordType) {
        const prefix = result.student.recordType.charAt(0).toUpperCase();
        requestType = RECORD_TYPE_PREFIXES[prefix] ?? FasterRequestType.UNKNOWN;
      }

      students.push(result.student);
    }

    if (students.length === 0 && errors.length > 0) {
      // All lines failed to parse -- flag as invalid request
      const existingInvalidRequest = errors.some(e => e.code === FasterErrorCode.INVALID_REQUEST);
      if (!existingInvalidRequest) {
        errors.unshift(this.createError(
          FasterErrorCode.INVALID_REQUEST,
          'No valid student records found in input file',
          '',
        ));
      }
    }

    this.logger.log(
      `Parsed ${sourceFilename}: ${students.length} students, ${errors.length} errors, type=${requestType}`,
    );

    return { sourceFilename, requestType, students, errors, parsedAt: new Date() };
  }

  /**
   * Parse a single FASTER request line.
   *
   * TODO: Fill in exact field positions from FASTER spec.
   * Current positions are placeholders:
   *   [0..2]  = Record type (3 chars)
   *   [3..12] = Student number (10 chars)
   *   [13..21] = Student SSN (9 chars, optional)
   */
  private parseLine(
    line: string,
  ): { student: FasterStudentRequest } | { error: FasterError } {
    try {
      // Check minimum length
      if (line.length < MIN_LINE_LENGTH) {
        return {
          error: this.createError(
            FasterErrorCode.MALFORMED_RECORD,
            `Line too short (${line.length} chars, minimum ${MIN_LINE_LENGTH})`,
            '',
          ),
        };
      }

      // Extract record type
      const recordType = line.substring(0, 3).trim();

      // Validate record type prefix
      const prefix = recordType.charAt(0).toUpperCase();
      if (!RECORD_TYPE_PREFIXES[prefix]) {
        return {
          error: this.createError(
            FasterErrorCode.INVALID_RECORD_TYPE,
            `Unrecognized record type: "${recordType}"`,
            '',
          ),
        };
      }

      // Extract student number
      const studentNumber = line.substring(3, 13).trim();

      if (!studentNumber) {
        return {
          error: this.createError(
            FasterErrorCode.MISSING_STUDENT_ID,
            'Student number field is blank',
            '',
          ),
        };
      }

      // Extract optional SSN
      const studentSsn = line.length > 13 ? line.substring(13, 22).trim() : undefined;

      return {
        student: {
          recordType,
          studentNumber,
          studentSsn: studentSsn || undefined,
          rawLine: line,
        },
      };
    } catch (err) {
      return {
        error: this.createError(
          FasterErrorCode.INPUT_PARSE_ERROR,
          `Unexpected parse error: ${(err as Error).message}`,
          '',
        ),
      };
    }
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

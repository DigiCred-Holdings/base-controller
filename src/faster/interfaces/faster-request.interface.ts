import { Enrollment } from 'src/enrollment/entities/enrollment.entity';

/** A single student request parsed from a FASTER input file line */
export interface FasterStudentRequest {
  recordType: string;
  studentNumber: string;
  studentSsn?: string;
  rawLine: string;
}

/** The full parsed batch request from one input file */
export interface FasterBatchRequest {
  sourceFilename: string;
  requestType: FasterRequestType;
  students: FasterStudentRequest[];
  errors: FasterError[];
  parsedAt: Date;
}

/** Discriminated request types based on FASTER record series */
export enum FasterRequestType {
  SECONDARY = 'SECONDARY',
  POSTSECONDARY = 'POSTSECONDARY',
  INTERDISTRICT = 'INTERDISTRICT',
  UNKNOWN = 'UNKNOWN',
}

/** Outcome for each student in a batch */
export interface FasterStudentResult {
  studentNumber: string;
  status: 'exported' | 'pending' | 'error';
  enrollment?: Enrollment;
  error?: FasterError;
}

/** Full batch processing result */
export interface FasterBatchResult {
  sourceFilename: string;
  readyToExport: Enrollment[];
  pendingWorkflow: FasterStudentRequest[];
  errors: FasterError[];
  exportedFilePath?: string;
  errorFilePath?: string;
}

/** Structured error for export and logging */
export interface FasterError {
  code: FasterErrorCode;
  message: string;
  studentNumber: string;
  timestamp: string;
}

export enum FasterErrorCode {
  // Input validation errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_RECORD_TYPE = 'INVALID_RECORD_TYPE',
  MALFORMED_RECORD = 'MALFORMED_RECORD',
  MISSING_STUDENT_ID = 'MISSING_STUDENT_ID',
  INPUT_PARSE_ERROR = 'INPUT_PARSE_ERROR',

  // Lookup errors
  ENROLLMENT_NOT_FOUND = 'ENROLLMENT_NOT_FOUND',
  CONNECTION_NOT_FOUND = 'CONNECTION_NOT_FOUND',

  // Workflow errors
  PROOF_REQUEST_FAILED = 'PROOF_REQUEST_FAILED',

  // Export errors
  EXPORT_WRITE_FAILED = 'EXPORT_WRITE_FAILED',
}

/** Data stored in Redis for pending requests */
export interface PendingFasterRequest {
  studentNumber: string;
  connectionId: string;
  sourceFilename: string;
  requestedAt: string;
}

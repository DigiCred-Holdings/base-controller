import { FasterProcessingService } from '../services/faster-processing.service';
import { FasterInputParser } from '../services/faster-input-parser';
import { FasterExportService } from '../services/faster-export.service';
import { FasterPendingService } from '../services/faster-pending.service';
import {
  FasterBatchRequest,
  FasterRequestType,
  FasterErrorCode,
  FasterError,
} from '../interfaces/faster-request.interface';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';

function makeEnrollment(studentNumber: string): Enrollment {
  const e = new Enrollment();
  e.enrollment_id = `conn-${studentNumber}`;
  e.student_number = studentNumber;
  e.student_full_name = 'Test Student';
  e.student_birth_date = '2005-01-01';
  e.student_address = '123 Main St';
  e.student_phone = '555-1234';
  e.student_email = 'test@test.com';
  e.student_ssn = '000000000';
  e.student_sex = 'M';
  e.school_name = 'Test School';
  e.school_address = '456 School Ave';
  e.graduation_date = '2029-05-15';
  e.gpa = '3.5';
  e.enrollment_status = 'started';
  e.grade_level = '10';
  e.terms = [] as any;
  e.student_info = {} as any;
  e.transcript = {} as any;
  e.created_at = new Date();
  return e;
}

function makeBatchRequest(
  studentNumbers: string[],
  parseErrors: FasterError[] = [],
): FasterBatchRequest {
  return {
    sourceFilename: 'test-request.txt',
    requestType: FasterRequestType.SECONDARY,
    students: studentNumbers.map(num => ({
      recordType: 'S00',
      studentNumber: num,
      rawLine: `S00${num.padEnd(10, ' ')}`,
    })),
    errors: parseErrors,
    parsedAt: new Date(),
  };
}

describe('FasterProcessingService', () => {
  let service: FasterProcessingService;
  let mockConfigService: { get: jest.Mock };
  let mockEnrollmentService: { findRecentByStudentNumbers: jest.Mock; findByStudentNumber: jest.Mock };
  let mockAcapyService: { getConnections: jest.Mock; sendProofRequest2: jest.Mock };
  let mockInputParser: FasterInputParser;
  let mockExportService: { exportBatch: jest.Mock; writeErrorFile: jest.Mock };
  let mockPendingService: { addPendingRequest: jest.Mock; getPendingRequest: jest.Mock; removePendingRequest: jest.Mock };

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: string) => {
        if (key === 'TRANSCRIPT_SCHEMA_NAME') return 'did:sov:123:2:transcript:1.0';
        return defaultVal ?? '';
      }),
    };
    mockEnrollmentService = {
      findRecentByStudentNumbers: jest.fn().mockResolvedValue([]),
      findByStudentNumber: jest.fn().mockResolvedValue(null),
    };
    mockAcapyService = {
      getConnections: jest.fn().mockResolvedValue({ results: [] }),
      sendProofRequest2: jest.fn().mockResolvedValue(undefined),
    };
    mockInputParser = new FasterInputParser();
    mockExportService = {
      exportBatch: jest.fn().mockReturnValue('/tmp/output.txt'),
      writeErrorFile: jest.fn().mockReturnValue('/tmp/errors.txt'),
    };
    mockPendingService = {
      addPendingRequest: jest.fn().mockResolvedValue(undefined),
      getPendingRequest: jest.fn().mockResolvedValue(null),
      removePendingRequest: jest.fn().mockResolvedValue(undefined),
    };

    service = new FasterProcessingService(
      mockConfigService as any,
      mockEnrollmentService as any,
      mockAcapyService as any,
      mockInputParser,
      mockExportService as any,
      mockPendingService as any,
    );
  });

  describe('processBatchRequest()', () => {
    it('exports immediately when all students have enrollments', async () => {
      const enrollments = [makeEnrollment('111'), makeEnrollment('222')];
      mockEnrollmentService.findRecentByStudentNumbers.mockResolvedValue(enrollments);

      const result = await service.processBatchRequest(makeBatchRequest(['111', '222']));

      expect(result.readyToExport.length).toBe(2);
      expect(result.pendingWorkflow.length).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(mockExportService.exportBatch).toHaveBeenCalledWith(enrollments, 'test-request.txt');
    });

    it('sends proof requests when students have connections but no enrollments', async () => {
      mockAcapyService.getConnections.mockResolvedValue({
        results: [
          { alias: 'Student -studentID- 111', state: 'active', connection_id: 'conn-111' },
        ],
      });

      const result = await service.processBatchRequest(makeBatchRequest(['111']));

      expect(result.readyToExport.length).toBe(0);
      expect(result.pendingWorkflow.length).toBe(1);
      expect(mockAcapyService.sendProofRequest2).toHaveBeenCalled();
      expect(mockPendingService.addPendingRequest).toHaveBeenCalledWith('111', expect.objectContaining({
        studentNumber: '111',
        connectionId: 'conn-111',
      }));
    });

    it('correctly partitions mixed batch', async () => {
      mockEnrollmentService.findRecentByStudentNumbers.mockResolvedValue([
        makeEnrollment('111'),
      ]);
      mockAcapyService.getConnections.mockResolvedValue({
        results: [
          { alias: 'Student -studentID- 222', state: 'active', connection_id: 'conn-222' },
        ],
      });

      const result = await service.processBatchRequest(makeBatchRequest(['111', '222', '333']));

      console.log(result);
      expect(result.readyToExport.length).toBe(1);
      expect(result.pendingWorkflow.length).toBe(1);
      // 333 has no enrollment and no connection -> error
      expect(result.errors.some(e =>
        e.code === FasterErrorCode.CONNECTION_NOT_FOUND && e.studentNumber === '333',
      )).toBe(true);
    });

    it('adds CONNECTION_NOT_FOUND error when no enrollment and no connection', async () => {
      const result = await service.processBatchRequest(makeBatchRequest(['999']));

      expect(result.errors.some(e => e.code === FasterErrorCode.CONNECTION_NOT_FOUND)).toBe(true);
      expect(result.errors.some(e => e.studentNumber === '999')).toBe(true);
    });

    it('adds PROOF_REQUEST_FAILED error when proof request throws', async () => {
      mockAcapyService.getConnections.mockResolvedValue({
        results: [
          { alias: 'Student -studentID- 111', state: 'active', connection_id: 'conn-111' },
        ],
      });
      mockAcapyService.sendProofRequest2.mockRejectedValue(new Error('ACA-Py timeout'));

      const result = await service.processBatchRequest(makeBatchRequest(['111']));

      expect(result.errors.some(e => e.code === FasterErrorCode.PROOF_REQUEST_FAILED)).toBe(true);
      expect(mockPendingService.addPendingRequest).not.toHaveBeenCalled();
    });

    it('includes parse errors from input parser in final result', async () => {
      const parseErrors: FasterError[] = [{
        code: FasterErrorCode.MALFORMED_RECORD,
        message: 'Line too short',
        studentNumber: '',
        timestamp: new Date().toISOString(),
      }];

      const result = await service.processBatchRequest(makeBatchRequest(['111'], parseErrors));

      expect(result.errors.some(e => e.code === FasterErrorCode.MALFORMED_RECORD)).toBe(true);
    });

    it('writes error file when there are errors', async () => {
      const result = await service.processBatchRequest(makeBatchRequest(['999']));

      expect(mockExportService.writeErrorFile).toHaveBeenCalled();
      expect(result.errorFilePath).toBe('/tmp/errors.txt');
    });

    it('does not write error file when there are no errors', async () => {
      mockEnrollmentService.findRecentByStudentNumbers.mockResolvedValue([
        makeEnrollment('111'),
      ]);

      const result = await service.processBatchRequest(makeBatchRequest(['111']));

      expect(mockExportService.writeErrorFile).not.toHaveBeenCalled();
      expect(result.errorFilePath).toBeUndefined();
    });

    it('does not export when there are no ready enrollments', async () => {
      mockAcapyService.getConnections.mockResolvedValue({
        results: [
          { alias: 'Student -studentID- 111', state: 'active', connection_id: 'conn-111' },
        ],
      });

      await service.processBatchRequest(makeBatchRequest(['111']));

      expect(mockExportService.exportBatch).not.toHaveBeenCalled();
    });

    it('handles empty batch (only parse errors) without crashing', async () => {
      const batchRequest: FasterBatchRequest = {
        sourceFilename: 'empty.txt',
        requestType: FasterRequestType.UNKNOWN,
        students: [],
        errors: [{
          code: FasterErrorCode.INVALID_REQUEST,
          message: 'Empty file',
          studentNumber: '',
          timestamp: new Date().toISOString(),
        }],
        parsedAt: new Date(),
      };

      const result = await service.processBatchRequest(batchRequest);

      expect(result.readyToExport.length).toBe(0);
      expect(result.pendingWorkflow.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(mockExportService.writeErrorFile).toHaveBeenCalled();
    });
  });
});

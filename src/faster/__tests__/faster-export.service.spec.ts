import { FasterExportService } from '../services/faster-export.service';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { FasterError, FasterErrorCode } from '../interfaces/faster-request.interface';
import * as fs from 'fs';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  const e = new Enrollment();
  e.enrollment_id = 'conn-123';
  e.student_number = '202500789';
  e.student_full_name = 'Emily Carter';
  e.student_birth_date = '2005-07-09';
  e.student_address = '321 Student Housing, Laramie, WY 82071';
  e.student_phone = '(307) 555-2233';
  e.student_email = 'emily.carter@uwyo.edu';
  e.student_ssn = '123456789';
  e.student_sex = 'F';
  e.school_name = 'University of Wyoming';
  e.school_address = '1000 E University Ave';
  e.graduation_date = '2029-05-15';
  e.gpa = '3.65';
  e.enrollment_status = 'started';
  e.grade_level = '10';
  e.terms = [
    {
      termYear: '2024',
      termSeason: 'Fall',
      courses: [
        { courseCode: 'ENG 101', courseTitle: 'English I', creditEarned: '3', grade: 'A' },
      ],
    },
  ] as any;
  e.student_info = {} as any;
  e.transcript = {} as any;
  e.created_at = new Date();
  Object.assign(e, overrides);
  return e;
}

describe('FasterExportService', () => {
  let service: FasterExportService;
  let mockConfigService: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: string) => {
        if (key === 'FASTER_OUTPUT_DIR') return '/tmp/faster-test';
        return defaultVal;
      }),
    };
    service = new FasterExportService(mockConfigService as any);
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.writeFileSync.mockImplementation(() => {});
  });

  describe('exportBatch()', () => {
    it('writes a file containing records for all enrollments', () => {
      const enrollments = [makeEnrollment(), makeEnrollment({ student_number: '202500456' })];

      const result = service.exportBatch(enrollments, 'request.txt');

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
      // Each enrollment: S00 + S01 + 1 course (S03) + S05 = 4 lines, x2 = 8 lines
      const lines = writtenContent.trim().split('\n');
      expect(lines.length).toBe(8);
      expect(result).toContain('FASTER_request_');
      expect(result).toContain('.txt');
    });

    it('writes batch of 1 for single enrollment', () => {
      const result = service.exportBatch([makeEnrollment()], 'single.txt');

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
      const lines = writtenContent.trim().split('\n');
      expect(lines.length).toBe(4); // S00 + S01 + S03 + S05
      expect(result).toContain('FASTER_single_');
    });

    it('creates output directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      service.exportBatch([makeEnrollment()], 'test.txt');

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/tmp/faster-test', { recursive: true });
    });

    it('throws when writeFileSync fails', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('disk full');
      });

      expect(() => service.exportBatch([makeEnrollment()], 'fail.txt')).toThrow('disk full');
    });
  });

  describe('writeErrorFile()', () => {
    it('writes error records in correct format', () => {
      const errors: FasterError[] = [
        {
          code: FasterErrorCode.CONNECTION_NOT_FOUND,
          message: 'No active connection',
          studentNumber: '202500789',
          timestamp: '2026-03-02T12:00:00Z',
        },
        {
          code: FasterErrorCode.INVALID_RECORD_TYPE,
          message: 'Bad record type',
          studentNumber: '',
          timestamp: '2026-03-02T12:00:01Z',
        },
      ];

      const result = service.writeErrorFile(errors, 'request.txt');

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      const writtenContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
      const lines = writtenContent.trim().split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0].substring(0, 3)).toBe('ERR');
      expect(result).toContain('FASTER_ERR_request_');
    });

    it('returns null when there are no errors', () => {
      const result = service.writeErrorFile([], 'no-errors.txt');

      expect(result).toBeNull();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('uses correct naming convention', () => {
      const errors: FasterError[] = [{
        code: FasterErrorCode.INVALID_REQUEST,
        message: 'Empty file',
        studentNumber: '',
        timestamp: '2026-03-02T12:00:00Z',
      }];

      const result = service.writeErrorFile(errors, 'input_batch.txt');

      expect(result).toContain('FASTER_ERR_input_batch_');
      expect(result).toEndWith('.txt');
    });
  });
});

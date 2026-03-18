import { FasterInputParser } from '../services/faster-input-parser';
import { FasterRequestType, FasterErrorCode } from '../interfaces/faster-request.interface';

// Helper to build a properly padded fixed-width line
// Fields: recordType(3) + studentNumber(10) + ssn(9) = 22 chars minimum
function makeLine(recordType: string, studentNumber: string, ssn?: string): string {
  const rt = recordType.padEnd(3, ' ');
  const sn = studentNumber.padEnd(10, ' ');
  return ssn ? rt + sn + ssn.padEnd(9, ' ') : rt + sn;
}

describe('FasterInputParser', () => {
  let parser: FasterInputParser;

  beforeEach(() => {
    parser = new FasterInputParser();
  });

  describe('parseBatchRequest()', () => {
    it('parses a valid multi-line file with S00 records', () => {
      const content = [
        makeLine('S00', '202500789', '123456789'),
        makeLine('S00', '202500456', '987654321'),
      ].join('\n');

      const result = parser.parseBatchRequest(content, 'test.txt');

      expect(result.students.length).toBe(2);
      expect(result.errors.length).toBe(0);
      expect(result.requestType).toBe(FasterRequestType.SECONDARY);
      expect(result.sourceFilename).toBe('test.txt');
      expect(result.students[0].studentNumber).toBe('202500789');
      expect(result.students[0].recordType).toBe('S00');
      expect(result.students[1].studentNumber).toBe('202500456');
    });

    it('parses a file with P00 records as POSTSECONDARY', () => {
      const content = makeLine('P00', '202500789', '123456789');

      const result = parser.parseBatchRequest(content, 'post.txt');

      expect(result.requestType).toBe(FasterRequestType.POSTSECONDARY);
      expect(result.students.length).toBe(1);
    });

    it('parses a file with I00 records as INTERDISTRICT', () => {
      const content = makeLine('I00', '202500789', '123456789');

      const result = parser.parseBatchRequest(content, 'inter.txt');

      expect(result.requestType).toBe(FasterRequestType.INTERDISTRICT);
      expect(result.students.length).toBe(1);
    });

    it('returns INVALID_RECORD_TYPE for unrecognized prefix', () => {
      const content = makeLine('X00', '202500789', '123456789');

      const result = parser.parseBatchRequest(content, 'bad.txt');

      expect(result.students.length).toBe(0);
      expect(result.errors.length).toBe(2); // INVALID_RECORD_TYPE + INVALID_REQUEST
      expect(result.errors.some(e => e.code === FasterErrorCode.INVALID_RECORD_TYPE)).toBe(true);
    });

    it('returns MALFORMED_RECORD for a line that is too short', () => {
      const content = 'S00short';

      const result = parser.parseBatchRequest(content, 'short.txt');

      expect(result.students.length).toBe(0);
      expect(result.errors.some(e => e.code === FasterErrorCode.MALFORMED_RECORD)).toBe(true);
    });

    it('returns MISSING_STUDENT_ID when student number is blank', () => {
      const content = 'S00          123456789';

      const result = parser.parseBatchRequest(content, 'blank.txt');

      expect(result.students.length).toBe(0);
      expect(result.errors.some(e => e.code === FasterErrorCode.MISSING_STUDENT_ID)).toBe(true);
    });

    it('returns INVALID_REQUEST for an empty file', () => {
      const result = parser.parseBatchRequest('', 'empty.txt');

      expect(result.students.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].code).toBe(FasterErrorCode.INVALID_REQUEST);
    });

    it('returns INVALID_REQUEST for whitespace-only file', () => {
      const result = parser.parseBatchRequest('   \n  \n  ', 'whitespace.txt');

      expect(result.students.length).toBe(0);
      expect(result.errors[0].code).toBe(FasterErrorCode.INVALID_REQUEST);
    });

    it('handles mixed valid and invalid lines', () => {
      const content = [
        makeLine('S00', '202500789', '123456789'),  // valid
        'short',                                      // too short
        makeLine('S00', '202500456', '987654321'),  // valid
        makeLine('X00', 'bad_prefix', '000000000'),  // invalid type
      ].join('\n');

      const result = parser.parseBatchRequest(content, 'mixed.txt');

      expect(result.students.length).toBe(2);
      expect(result.errors.length).toBe(2);
    });

    it('extracts SSN when present', () => {
      const content = makeLine('S00', '202500789', '123456789') + 'extra_data';

      const result = parser.parseBatchRequest(content, 'ssn.txt');

      expect(result.students[0].studentSsn).toBe('123456789');
    });

    it('sets SSN to undefined when line has no SSN segment', () => {
      // Line is exactly 13 chars (record type 3 + student number 10)
      const content = 'S00' + '2025007891';

      const result = parser.parseBatchRequest(content, 'no-ssn.txt');

      expect(result.students[0].studentSsn).toBeUndefined();
    });

    it('preserves rawLine for each parsed student', () => {
      const line = makeLine('S00', '202500789', '123456789');
      const result = parser.parseBatchRequest(line, 'raw.txt');

      expect(result.students[0].rawLine).toBe(line);
    });

    it('sets parsedAt to a Date', () => {
      const result = parser.parseBatchRequest(
        makeLine('S00', '202500789', '123456789'),
        'date.txt',
      );

      expect(result.parsedAt).toBeInstanceOf(Date);
    });
  });
});

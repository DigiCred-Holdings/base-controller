import {
  buildS01Record,
  buildS03Record,
  buildS05Record,
  buildErrorRecord,
  buildAllRecords,
  ERR_LENGTH,
} from '../templates/record-templates';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { FasterError, FasterErrorCode } from '../interfaces/faster-request.interface';
import { FasterTermData, FasterCourseData } from '../interfaces/faster-record.interface';

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  const e = new Enrollment();
  e.enrollment_id = 'conn-123';
  e.student_number = '202500789';
  e.student_full_name = 'Emily Carter';
  e.student_birth_date = '2005-07-09';
  e.student_address = '321 Student Housing, Apt 45, Laramie, WY 82071';
  e.student_phone = '(307) 555-2233';
  e.student_email = 'emily.carter@uwyo.edu';
  e.student_ssn = '123456789';
  e.student_sex = 'F';
  e.school_name = 'University of Wyoming';
  e.school_address = '1000 E University Ave, Laramie, WY 82071';
  e.graduation_date = '2029-05-15';
  e.gpa = '3.65';
  e.enrollment_status = 'started';
  e.grade_level = '10';
  e.terms = [] as any;
  e.student_info = {} as any;
  e.transcript = {} as any;
  e.created_at = new Date();
  Object.assign(e, overrides);
  return e;
}


describe('buildS01Record()', () => {
  it('returns a string of expected total length', () => {
    const result = buildS01Record(makeEnrollment());
    expect(result.length).toBe(1016);
  });

  it('starts with record type S01', () => {
    const result = buildS01Record(makeEnrollment());
    expect(result.substring(0, 3)).toBe('S01');
  });
});

describe('buildS03Record()', () => {
  const term: FasterTermData = {
    termYear: '2024',
    termSeason: 'Fall Semester',
    courses: [],
  };

  const course: FasterCourseData = {
    courseCode: 'CRMJ 2210',
    courseTitle: 'Criminal Law',
    creditEarned: '3',
    grade: 'A',
  };

  it('returns a string of expected total length', () => {
    const result = buildS03Record(makeEnrollment(), term);
    expect(result.length).toBe(1020);
  });

  it('starts with record type S03', () => {
    const result = buildS03Record(makeEnrollment(), term);
    expect(result.substring(0, 3)).toBe('S03');
  });

  it('handles missing course data gracefully', () => {
    const result = buildS03Record(makeEnrollment(), term);
    expect(result.length).toBe(1020);
  });
});

describe('buildS05Record()', () => {
  it('returns a string of expected total length', () => {
    const result = buildS05Record(makeEnrollment());
    expect(result.length).toBe(1020);
  });

  it('starts with record type S05', () => {
    const result = buildS05Record(makeEnrollment());
    expect(result.substring(0, 3)).toBe('S05');
  });
});

describe('buildErrorRecord()', () => {
  const error: FasterError = {
    code: FasterErrorCode.CONNECTION_NOT_FOUND,
    message: 'No active connection for student',
    studentNumber: '202500789',
    timestamp: '2026-03-02T12:00:00Z',
  };

  it('returns a string of expected total length', () => {
    const result = buildErrorRecord(error);
    expect(result.length).toBe(ERR_LENGTH);
  });

  it('starts with ERR record type', () => {
    const result = buildErrorRecord(error);
    expect(result.substring(0, 3)).toBe('ERR');
  });
});

describe('buildAllRecords()', () => {
  it('returns correct number of lines for enrollment with courses', () => {
    const terms = [
      {
        termYear: '2024',
        termSeason: 'Fall Semester',
        courses: [
          { courseCode: 'CRMJ 2210', courseTitle: 'Criminal Law', creditEarned: '3', grade: 'A' },
          { courseCode: 'CRMJ 1001', courseTitle: 'Intro CJ', creditEarned: '3', grade: 'B+' },
        ],
      },
      {
        termYear: '2025',
        termSeason: 'Spring Semester',
        courses: [
          { courseCode: 'CRMJ 2400', courseTitle: 'Criminology', creditEarned: '3', grade: 'B+' },
        ],
      },
    ];
    const enrollment = makeEnrollment({ terms: terms as any });
    const lines = buildAllRecords(enrollment);
    // S01 + 2 terms (each with S03 + courses S04) + S05 = 7 lines (S01 + S03 + S04 + S04 + S03 + S04 + S05)
    expect(lines.length).toBe(7);
  });

  it('returns S01 + S05 for enrollment with no courses', () => {
    const enrollment = makeEnrollment({ terms: [] as any });
    const lines = buildAllRecords(enrollment);
    expect(lines.length).toBe(2);
  });

  it('handles null terms gracefully', () => {
    const enrollment = makeEnrollment({ terms: null as any });
    const lines = buildAllRecords(enrollment);
    expect(lines.length).toBe(2);
  });

  it('each line has consistent length for its record type', () => {
    const terms = [
      {
        termYear: '2024',
        termSeason: 'Fall',
        courses: [
          { courseCode: 'ENG 101', courseTitle: 'English I', creditEarned: '3', grade: 'A' },
        ],
      },
    ];
    const enrollment = makeEnrollment({ terms: terms as any });
    const lines = buildAllRecords(enrollment);

    expect(lines[0].length).toBe(1016); // S01
    expect(lines[1].length).toBe(1020); // S03
    expect(lines[2].length).toBe(1020); // S04
    expect(lines[3].length).toBe(1020); // S05
  });
});

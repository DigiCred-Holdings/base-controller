import {
  buildS00Record,
  buildS01Record,
  buildS03Record,
  buildS05Record,
  buildErrorRecord,
  buildAllRecords,
  S00_LENGTH,
  S01_LENGTH,
  S03_LENGTH,
  S05_LENGTH,
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

describe('buildS00Record()', () => {
  it('returns a string of expected total length', () => {
    const enrollment = makeEnrollment();
    const result = buildS00Record(enrollment);
    expect(result.length).toBe(S00_LENGTH);
  });

  it('starts with record type S00', () => {
    const result = buildS00Record(makeEnrollment());
    expect(result.substring(0, 3)).toBe('S00');
  });

  it('includes student number at correct position', () => {
    const result = buildS00Record(makeEnrollment({ student_number: '202500789' }));
    expect(result.substring(3, 13)).toBe('202500789 ');
  });

  it('handles undefined fields gracefully', () => {
    const enrollment = makeEnrollment({
      student_ssn: undefined as any,
      student_sex: undefined as any,
    });
    const result = buildS00Record(enrollment);
    expect(result.length).toBe(S00_LENGTH);
    // Should contain spaces where undefined fields are
    expect(result).not.toContain('undefined');
  });
});

describe('buildS01Record()', () => {
  it('returns a string of expected total length', () => {
    const result = buildS01Record(makeEnrollment());
    expect(result.length).toBe(S01_LENGTH);
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
    const result = buildS03Record(makeEnrollment(), term, course);
    expect(result.length).toBe(S03_LENGTH);
  });

  it('starts with record type S03', () => {
    const result = buildS03Record(makeEnrollment(), term, course);
    expect(result.substring(0, 3)).toBe('S03');
  });

  it('handles missing course data gracefully', () => {
    const emptyCourse: FasterCourseData = {
      courseCode: '',
      courseTitle: '',
      creditEarned: '',
      grade: '',
    };
    const result = buildS03Record(makeEnrollment(), term, emptyCourse);
    expect(result.length).toBe(S03_LENGTH);
  });
});

describe('buildS05Record()', () => {
  it('returns a string of expected total length', () => {
    const result = buildS05Record(makeEnrollment());
    expect(result.length).toBe(S05_LENGTH);
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
    // S00 + S01 + 3 courses (S03) + S05 = 6 lines
    expect(lines.length).toBe(6);
  });

  it('returns S00 + S01 + S05 for enrollment with no courses', () => {
    const enrollment = makeEnrollment({ terms: [] as any });
    const lines = buildAllRecords(enrollment);
    expect(lines.length).toBe(3);
  });

  it('handles null terms gracefully', () => {
    const enrollment = makeEnrollment({ terms: null as any });
    const lines = buildAllRecords(enrollment);
    expect(lines.length).toBe(3);
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

    expect(lines[0].length).toBe(S00_LENGTH); // S00
    expect(lines[1].length).toBe(S01_LENGTH); // S01
    expect(lines[2].length).toBe(S03_LENGTH); // S03
    expect(lines[3].length).toBe(S05_LENGTH); // S05
  });
});

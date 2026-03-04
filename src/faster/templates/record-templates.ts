import { field, numField } from './field.helper';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { FasterError } from '../interfaces/faster-request.interface';
import { FasterTermData, FasterCourseData } from '../interfaces/faster-record.interface';

/**
 * FASTER record template functions.
 * Each function takes typed data and returns a single fixed-length line.
 *
 * IMPORTANT: Field positions and lengths below are PLACEHOLDERS.
 * Fill in exact positions from the FASTER specification.
 */

// --- Field length constants (placeholder values -- update per FASTER spec) ---
const RECORD_TYPE_LEN = 3;
const STUDENT_NUMBER_LEN = 10;
const SSN_LEN = 9;
const FULL_NAME_LEN = 40;
const BIRTH_DATE_LEN = 10;
const SEX_LEN = 1;
const GRADE_LEVEL_LEN = 2;
const ADDRESS_LEN = 60;
const PHONE_LEN = 15;
const EMAIL_LEN = 40;
const TERM_YEAR_LEN = 4;
const TERM_SEASON_LEN = 15;
const COURSE_CODE_LEN = 12;
const COURSE_TITLE_LEN = 40;
const CREDIT_EARNED_LEN = 5;
const GRADE_LEN = 3;
const GPA_LEN = 5;
const GRADUATION_DATE_LEN = 10;
const SCHOOL_NAME_LEN = 40;

// Error record field lengths
const ERROR_CODE_LEN = 30;
const ERROR_MESSAGE_LEN = 80;
const ERROR_TIMESTAMP_LEN = 20;

// --- Computed total line lengths ---
export const S00_LENGTH = RECORD_TYPE_LEN + STUDENT_NUMBER_LEN + SSN_LEN + FULL_NAME_LEN
  + BIRTH_DATE_LEN + SEX_LEN + GRADE_LEVEL_LEN + SCHOOL_NAME_LEN;
export const S01_LENGTH = RECORD_TYPE_LEN + STUDENT_NUMBER_LEN + ADDRESS_LEN + PHONE_LEN + EMAIL_LEN;
export const S03_LENGTH = RECORD_TYPE_LEN + STUDENT_NUMBER_LEN + TERM_YEAR_LEN + TERM_SEASON_LEN
  + COURSE_CODE_LEN + COURSE_TITLE_LEN + CREDIT_EARNED_LEN + GRADE_LEN;
export const S05_LENGTH = RECORD_TYPE_LEN + STUDENT_NUMBER_LEN + GPA_LEN + GRADUATION_DATE_LEN;
export const ERR_LENGTH = RECORD_TYPE_LEN + STUDENT_NUMBER_LEN + ERROR_CODE_LEN
  + ERROR_MESSAGE_LEN + ERROR_TIMESTAMP_LEN;

/** S00 - Student Demographics */
export function buildS00Record(enrollment: Enrollment): string {
  return [
    field(RECORD_TYPE_LEN, 'S00'),
    field(STUDENT_NUMBER_LEN, enrollment.student_number),
    field(SSN_LEN, enrollment.student_ssn),
    field(FULL_NAME_LEN, enrollment.student_full_name),
    field(BIRTH_DATE_LEN, enrollment.student_birth_date),
    field(SEX_LEN, enrollment.student_sex),
    field(GRADE_LEVEL_LEN, enrollment.grade_level),
    field(SCHOOL_NAME_LEN, enrollment.school_name),
  ].join('');
}

/** S01 - Student Address/Contact */
export function buildS01Record(enrollment: Enrollment): string {
  return [
    field(RECORD_TYPE_LEN, 'S01'),
    field(STUDENT_NUMBER_LEN, enrollment.student_number),
    field(ADDRESS_LEN, enrollment.student_address),
    field(PHONE_LEN, enrollment.student_phone),
    field(EMAIL_LEN, enrollment.student_email),
  ].join('');
}

/** S03 - Course Record (one per course) */
export function buildS03Record(
  enrollment: Enrollment,
  term: FasterTermData,
  course: FasterCourseData,
): string {
  return [
    field(RECORD_TYPE_LEN, 'S03'),
    field(STUDENT_NUMBER_LEN, enrollment.student_number),
    field(TERM_YEAR_LEN, term.termYear),
    field(TERM_SEASON_LEN, term.termSeason),
    field(COURSE_CODE_LEN, course.courseCode),
    field(COURSE_TITLE_LEN, course.courseTitle),
    numField(CREDIT_EARNED_LEN, course.creditEarned),
    field(GRADE_LEN, course.grade),
  ].join('');
}

/** S05 - GPA/Summary */
export function buildS05Record(enrollment: Enrollment): string {
  return [
    field(RECORD_TYPE_LEN, 'S05'),
    field(STUDENT_NUMBER_LEN, enrollment.student_number),
    numField(GPA_LEN, enrollment.gpa),
    field(GRADUATION_DATE_LEN, enrollment.graduation_date),
  ].join('');
}

/** ERR - Error Record */
export function buildErrorRecord(error: FasterError): string {
  return [
    field(RECORD_TYPE_LEN, 'ERR'),
    field(STUDENT_NUMBER_LEN, error.studentNumber),
    field(ERROR_CODE_LEN, error.code),
    field(ERROR_MESSAGE_LEN, error.message),
    field(ERROR_TIMESTAMP_LEN, error.timestamp),
  ].join('');
}

/**
 * Build all FASTER records for a single student enrollment.
 * Returns array of fixed-length lines.
 */
export function buildAllRecords(enrollment: Enrollment): string[] {
  const lines: string[] = [];

  // S00 - Demographics
  lines.push(buildS00Record(enrollment));

  // S01 - Address/Contact
  lines.push(buildS01Record(enrollment));

  // S03 - Course records (from terms JSONB)
  const terms = enrollment.terms as unknown as FasterTermData[];
  if (terms && Array.isArray(terms)) {
    for (const term of terms) {
      const courses = term.courses || [];
      if (Array.isArray(courses)) {
        for (const course of courses) {
          lines.push(buildS03Record(enrollment, term, course));
        }
      }
    }
  }

  // S05 - GPA Summary
  lines.push(buildS05Record(enrollment));

  return lines;
}

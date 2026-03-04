/** Typed student demographic record (maps to S00/P00) */
export interface FasterDemographicRecord {
  recordType: string;
  studentNumber: string;
  studentSsn: string;
  studentFullName: string;
  studentBirthDate: string;
  studentSex: string;
  gradeLevel: string;
}

/** Typed address/contact record (maps to S01/P01) */
export interface FasterAddressRecord {
  recordType: string;
  studentNumber: string;
  studentAddress: string;
  studentPhone: string;
  studentEmail: string;
}

/** Typed course record (maps to S03/S04) */
export interface FasterCourseRecord {
  recordType: string;
  studentNumber: string;
  termYear: string;
  termSeason: string;
  courseCode: string;
  courseTitle: string;
  creditEarned: string;
  grade: string;
}

/** Typed GPA/summary record (maps to S05/P05) */
export interface FasterSummaryRecord {
  recordType: string;
  studentNumber: string;
  gpa: string;
  graduationDate: string;
}

/** Term data extracted from enrollment JSONB */
export interface FasterTermData {
  termYear: string;
  termSeason: string;
  courses: FasterCourseData[];
}

/** Course data extracted from enrollment JSONB */
export interface FasterCourseData {
  courseCode: string;
  courseTitle: string;
  creditEarned: string;
  grade: string;
}

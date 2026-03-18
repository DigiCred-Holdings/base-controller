import { field, numField } from './field.helper';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { FasterError } from '../interfaces/faster-request.interface';
import { FasterTermData, FasterCourseData } from '../interfaces/faster-record.interface';

/**
 * FASTER record template functions.
 * Each function takes typed data and returns a single fixed-length line.
 *
 * Two record format families are relevant:
 *   - I/S01 (Interdistrict/Secondary) "Student Information" - Record Size: 1020
 *     I01 = Interdistrict and Bright Futures
 *     S01 = Secondary to Postsecondary Transcript Transfer, and Bright Futures Record Transfer
 *   - P01 (Postsecondary) "Demographic Information" - Record Size: 1020
 *
 * Field Characteristics key:
 *   A   = Alphabetic only
 *   A/N = Alphanumeric
 *   N   = Numeric only
 *   Z   = Zoned numeric
 *   P   = Packed decimal
 *   R   = Right justified with leading zeros
 *   L   = Left justified
 *
 * Source: FASTER 2025-2026 Interdistrict/Secondary Record Formats (InterdistSec-RFR.pdf)
 *         FASTER 2025-2026 Postsecondary Record Formats (postsec-rf.pdf)
 */

// =============================================================================
// I/S01 - Student Demographic Information (Interdistrict/Secondary)
// Record Size: 1020
// =============================================================================
//
// # | Pos     | Len | Type  | Field Name (* = required)
// --|---------|-----|-------|--------------------------------------------------
//  1 | 1-3     |   3 | A/N   | Record Type*
//    |         |     |       |   I01 = Interdistrict and Bright Futures
//    |         |     |       |   S01 = Secondary to Postsecondary Transfer
// --|---------|-----|-------|--------------------------------------------------
//  2 | 4-13    |  10 | A/N/R | Student Number Identifier, Florida*
//    |         |     |       |   First 9 digits: SSN; 10th digit: "X"
//    |         |     |       |   If no SSN/ID: "999999999G"
// --|---------|-----|-------|--------------------------------------------------
//  3 | 14-15   |   2 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
//  4 | 16-17   |   2 | N/R   | District Number, Current Enrollment*
//    |         |     |       |   01-68, 71-76, 80-83 = State assigned district
//    |         |     |       |   99 = Other than Florida Public School
// --|---------|-----|-------|--------------------------------------------------
//  5 | 18-21   |   4 | A/N/R | School Number, Current Enrollment*
//    |         |     |       |   0001-9899 = State Master School ID
//    |         |     |       |   0000 = In-state postsecondary/SPEEDE
//    |         |     |       |   3450 = Personalized Education Program (PEP)
//    |         |     |       |   3518 = McKay Scholarship (obsolete July 2022)
//    |         |     |       |   3900 = Family Empowerment Scholarship (last valid 2023-24)
//    |         |     |       |   3950 = Family Empowerment - not FEFP funded
//    |         |     |       |   7001 = Virtual Instruction Program
//    |         |     |       |   7004 = FL Virtual School Franchise
//    |         |     |       |   7006 = School District Virtual Course (last valid 2024-25)
//    |         |     |       |   7023 = Virtual Instruction by school district
//    |         |     |       |   9992-9998 = Special categories (migrant, private, home school)
// --|---------|-----|-------|--------------------------------------------------
//  6 | 22-31   |  10 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
//  7 | 32-41   |  10 | A/N/R | Student Number Identifier-Alias, Florida
//    |         |     |       |   Same format as Student Number (item 2)
// --|---------|-----|-------|--------------------------------------------------
//  8 | 42-46   |   5 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
//  9 | 47-88   |  42 | A/N/L | Student Name, Legal*
//    | 47-63   |  17 |       |   Last Name
//    | 64-66   |   3 |       |   Appendage (Jr, Sr, III, etc.)
//    | 67-78   |  12 |       |   First Name
//    | 79-88   |  10 |       |   Middle/Maiden Name or Initial
// --|---------|-----|-------|--------------------------------------------------
// 10 | 89-89   |   1 | A/N   | Ethnicity** (Hispanic/Latino)
//    |         |     |       |   Y/N
// 10a| 90-90   |   1 | A/N   | Race: American Indian or Alaska Native**  Y/N
// 10b| 91-91   |   1 | A/N   | Race: Asian**  Y/N
// 10c| 92-92   |   1 | A/N   | Race: Black or African American**  Y/N
// 10d| 93-93   |   1 | A/N   | Race: Native Hawaiian/Other Pacific Islander**  Y/N
// 10e| 94-94   |   1 | A/N   | Race: White**  Y/N
// --|---------|-----|-------|--------------------------------------------------
// 11 | 95-95   |   1 | A     | Sex*  M/F
// --|---------|-----|-------|--------------------------------------------------
// 12 | 96-96   |   1 | A     | Racial/Ethnic Category*
//    |         |     |       |   W=White  B=Black  H=Hispanic  A=Asian/Pacific Islander
//    |         |     |       |   I=American Indian/Alaskan  M=Multiracial
// --|---------|-----|-------|--------------------------------------------------
// 13 | 97-108  |  12 | A/N   | MSIX Identification Number (MSIX ID)
// 14 | 109-109 |   1 | A/N   | Migrant Status Term
// 15 | 110-111 |   2 | A/N   | Migrant Birth State
// 15a| 112-112 |   1 | A/N   | Military Family Student  Y/N/Z
// --|---------|-----|-------|--------------------------------------------------
// 16 | 113-114 |   2 | A/N   | Grade Level*
//    |         |     |       |   PK=Pre-K  KG=Kindergarten  01-12=Grades
//    |         |     |       |   23=Certificate of Completion eligible
//    |         |     |       |   30=Adult Non-HS Grad  31=Adult HS Grad
// --|---------|-----|-------|--------------------------------------------------
// 17 | 115-115 |   1 | A/N   | Filler
// 17a| 116-116 |   1 | A/N   | Migrant Summer Term  S/blank
// 17b| 117-117 |   1 | A/N   | Migrant Annual Term  3/blank
// 18 | 118-120 |   3 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
// 18a| 121-121 |   1 | A/N   | Diploma Designation*
//    |         |     |       |   S=Scholar  M=Merit (obsolete 2023-24+)
//    |         |     |       |   I=Industry Scholar (effective 2023-24+)
//    |         |     |       |   B=Both  Z=Not Applicable
// 18b| 122-122 |   1 | A/N   | Graduation Option
// --|---------|-----|-------|--------------------------------------------------
// 19a| 123-130 |   8 | A/N   | Min Exceptional Student Ed Performance Standards Date (MMDDCCYY)
// 19b| 131-138 |   8 | A/N   | MEP Enrollment Date* (MMDDCCYY)
// 19c| 139-146 |   8 | A/N   | Year Entered Ninth Grade (CCYYCCYY)
// 19d| 147-147 |   1 | A/N   | National Merit Scholar  S=Scholar F=Finalist Z=N/A
// 19e| 148-148 |   1 | A/N   | National Achievement Scholar  S/F/Z
// 19f| 149-154 |   6 | A/N   | Communications, Date Passed (MMCCYY)
// 19g| 155-160 |   6 | A/N   | Mathematics, Date Passed (MMCCYY)
// 19h| 161-161 |   1 | A/N   | National Hispanic Scholar  S/Z
// --|---------|-----|-------|--------------------------------------------------
// 20 | 162-214 |  53 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
// 21 | 215-278 |  64 | A/N/L | Address, Mailing*
//    | 215-239 |  25 |       |   Street number & name / PO Box / route & box
//    | 240-249 |  10 |       |   Apartment number, building number
//    | 250-269 |  20 |       |   City and State (pos 19-20 must be 2-char state code)
//    | 270-278 |   9 |       |   Zip Code (left justified)
// --|---------|-----|-------|--------------------------------------------------
// 22 | 279-446 | 168 | A/N/L | Student Name, AKA (up to 4 names)
//    | 279-320 |  42 |       |   Name 1
//    | 321-362 |  42 |       |   Name 2
//    | 363-404 |  42 |       |   Name 3
//    | 405-446 |  42 |       |   Name 4
// --|---------|-----|-------|--------------------------------------------------
// 23 | 447-447 |   1 | A/N   | Birth Date Verification  (1-9, T)
// 24 | 448-465 |  18 | A/N   | Birth Place (free form)
// 25 | 466-466 |   1 | A     | Female Parent/Guardian Code  P/G/O/A/S/N
// 26 | 467-491 |  25 | A/N   | Female Parent/Guardian Name
// 27 | 492-492 |   1 | A     | Male Parent/Guardian Code  P/G/O/A/S/N
// 28 | 493-517 |  25 | A/N   | Male Parent/Guardian Name
// 29 | 518-518 |   1 | A     | Parent/Guardian Code  M/F
// 30 | 519-543 |  25 | A/N   | Parent/Guardian Name
// --|---------|-----|-------|--------------------------------------------------
// 31a| 544-544 |   1 | A     | Health Examination, School Entry*  Y/T/R/N/V
//    |         |     |       |   (required on I01, NOT required on S01)
// 31b| 545-545 |   1 | A     | Critical/Chronic Health - 911 Medical Alert  Y/N
// 31c| 546-590 |  45 | A/N/L | Critical/Chronic Health - 911 Contact
// 31d| 591-592 |   2 | A     | Screening for Hearing  HY/HT/HN/ZZ
// 31e| 593-594 |   2 | A     | Screening for Vision  VY/VT/VN/ZZ
// --|---------|-----|-------|--------------------------------------------------
// 32 | 595-649 |  55 | A/N   | Filler
// 33 | 650-674 |  25 | A/N/L | School Name, Current*
// 34 | 675-739 |  65 | A/N/L | School Address, Current
//    | 675-707 |  33 |       |   Address Line 1
//    | 708-739 |  32 |       |   Address Line 2
// 35 | 740-749 |  10 | N     | School Phone Number*  (e.g. 8505551212)
// --|---------|-----|-------|--------------------------------------------------
// 36a| 750-750 |   1 | A/N   | Migrant Continuation of Services*  A/B/C/Z
// 36b| 751-751 |   1 | A/N   | Migrant Priority for Services*  Y/N/Z
// 36c| 752-752 |   1 | A/N   | Filler
// 36d| 753-753 |   1 | A/N   | Residency for Tuition Purposes  D/F/N/Z
// 36e| 754-754 |   1 | A/N   | Online Course Exempt  D/T/Z
// 36f| 755-756 |   2 | A/N   | Adult Fee Status
// 36g| 757-757 |   1 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
// 37 | 758-760 |   3 | A/N   | Withdrawal Code
// 38 | 761-768 |   8 | A/N   | Withdrawal Date (MMDDCCYY)
// --|---------|-----|-------|--------------------------------------------------
// 39 | 769-856 |  84 | N/R   | Credits Needed, Local Subject Area Requirements
//    |         |     |       |   (two implied decimal places, e.g. 0150 = 1.50 credits)
//    | 769-772 |   4 |       |   ENGLISH
//    | 773-776 |   4 |       |   MATHEMATICS
//    | 777-780 |   4 |       |   SCIENCE
//    | 781-784 |   4 |       |   U.S. HISTORY
//    | 785-788 |   4 |       |   WORLD HISTORY
//    | 789-792 |   4 |       |   ECONOMICS
//    | 793-796 |   4 |       |   U.S. GOVERNMENT
//    | 797-800 |   4 |       |   PRACTICAL ARTS/CAREER & TECHNICAL
//    | 801-804 |   4 |       |   PERFORM FINE ART
//    | 805-808 |   4 |       |   LIFE MGMT SKILLS
//    | 809-812 |   4 |       |   PHYSICAL ED
//    | 813-816 |   4 |       |   WORLD LANGUAGE
//    | 817-820 |   4 |       |   LANGUAGE ARTS
//    | 821-824 |   4 |       |   SOCIAL STUDIES
//    | 825-828 |   4 |       |   ELECTIVE
//    | 829-832 |   4 |       |   ESE
//    | 833-836 |   4 |       |   COMPUTER ED
//    | 837-840 |   4 |       |   ALGEBRA 1
//    | 841-844 |   4 |       |   GEOMETRY
//    | 845-848 |   4 |       |   BIOLOGY
//    | 849-852 |   4 |       |   ALGEBRA 2
//    | 853-856 |   4 |       |   FINANCIAL LITERACY
// --|---------|-----|-------|--------------------------------------------------
// 39x| 857-875 |  19 | N     | Filler (reserved for future assessment requirements)
// 39g| 876-876 |   1 | A/N   | Civic Literacy Assessment Passed  Y/N/blank
// 39f| 877-877 |   1 | A/N   | English/Language Arts Assessment Passed Met  Y/N/Z
// 39a| 878-878 |   1 | A/N   | Algebra 2 Assessment Passed  Y/E/blank
// 39b| 879-879 |   1 | A/N   | Algebra 1 Assessment Met  Y/E/N/Z
// 39c| 880-880 |   1 | A/N   | Geometry Assessment Passed  Y/E/blank
// 39d| 881-881 |   1 | A/N   | Biology Assessment Passed  Y/E/blank
// 39e| 882-882 |   1 | A/N   | U.S. History Assessment Passed  Y/E/blank
// --|---------|-----|-------|--------------------------------------------------
// 40 | 883-888 |   6 | N/R   | Class Rank, Numerical Position
// 41 | 889-890 |   2 | N/R   | Class Rank, Percentile
// 42 | 891-896 |   6 | N/R   | Class Rank, Total Number
// 43 | 897-901 |   5 | N     | Grade Point Average District, Cumulative (NNNNN / 4.0 scale implied)
// 44 | 902-906 |   5 | N     | Grade Point Average State, Cumulative*
//    |         |     |       |   (NNNNN e.g. 36250 = 3.6250, on 4.0 scale)
// --|---------|-----|-------|--------------------------------------------------
// 45 | 907-914 |   8 | N     | Diploma Date (Graduation Date) (MMDDCCYY)
// 46 | 915-917 |   3 | A/N   | Diploma Type (see Student Information System)
// 47 | 918-925 |   8 | N     | Certificate of Completion, Date (MMDDCCYY)
//    |         |     |       |   (no longer effective after July 1, 2025)
// 48 | 926-928 |   3 | A/N   | Certificate of Completion, Type
//    |         |     |       |   (no longer effective after July 1, 2025)
// 49 | 929-936 |   8 | A/N   | Class Rank, Effective Date (MMDDCCYY)
// 50 | 937-938 |   2 | A/N   | Native Language, Student  (NN or ZZ)
// 51 | 939-946 |   8 | A/N   | ELL Home Language Survey Date (CCYYMMDD)
// 52 | 947-948 |   2 | A/N   | Country of Birth
// 53 | 949-950 |   2 | A/N   | Parent/Guardian Primary Home Language Spoken In Home
// 54 | 951-952 |   2 | A/N   | Graduation Requirement Basis
// 55 | 953-960 |   8 | N     | Birth Date* (CCYYMMDD)
// 56 | 961-961 |   1 | A/N   | Resident Status, State/County  0/A/B/2-7/Z
// 57 | 962-962 |   1 | A/N   | Multiple Birth Student  Y/N/Z
// 57a| 963-964 |   2 | A/N   | Filler
// 58 | 965-965 |   1 | A/N   | Even Start Family Literacy Program*  Y/N/Z
// 59 | 966-966 |   1 | A/N   | Florida First Start Program*  Y/N/Z
// 60 | 967-967 |   1 | A/N   | Fine Arts Seal Diploma Designation  Y/Z
// 61 | 968-968 |   1 | A/N   | Program Participation Prior to Kindergarten (discontinued)
// 62 | 969-969 |   1 | A/N   | Differentiated Diploma*  1/Z
// 63 | 970-970 |   1 | A/N   | International Baccalaureate Diploma*  Y/N/Z
// 64 | 971-971 |   1 | A/N   | College Ready Diploma  Y/N/Z
// 65 | 972-972 |   1 | A/N   | AICE Certificate*  Y/N/Z
// 66 | 973-973 |   1 | A/N   | District Community/Volunteer Service Met  Y/N/Z/blank
// 67 | 974-974 |   1 | A/N   | Early Admission Student  Y/Z
// 68 | 975-975 |   1 | A/N   | Additional School Year Student
// 69 | 976-976 |   1 | A/N   | AICE Diploma  Y/N/Z
// 70 | 977-977 |   1 | A/N   | Biliteracy Seal Diploma Designation  G/S/B/Z
// 71 | 978-981 |   4 | N/R   | Paid Work Hours
// 71a| 982-985 |   4 | A/N   | Filler
// 72 | 986-989 |   4 | N/R   | Volunteer Service Hours
// 73 | 990-990 |   1 | A/N   | Physical Education Waiver (KG-8)  Y/N/Z
// --|---------|-----|-------|--------------------------------------------------
// 74 | 991-1011|  21 | A/N   | Filler
// 75 |1012-1020|   9 | A/N   | Filler Reserved for Local Use
// =============================================================================

// =============================================================================
// P01 - Postsecondary Demographic Information
// Record Size: 1020
// =============================================================================
//
// # | Pos     | Len | Type  | Field Name (* = required)
// --|---------|-----|-------|--------------------------------------------------
//  1 | 1-3     |   3 | A/N   | Record Type*  (always "P01")
// --|---------|-----|-------|--------------------------------------------------
//  2 | 4-13    |  10 | A/N/L | Social Security Number*
//    | 4-12    |   9 | N     |   Social Security Number
//    | 13-13   |   1 | A/N   |   Filler
// --|---------|-----|-------|--------------------------------------------------
//  3 | 14-21   |   8 | N     | Date Prepared* (MMDDCCYY)
// --|---------|-----|-------|--------------------------------------------------
//  4 | 22-22   |   1 | A     | Transcript Status*
//    |         |     |       |   Y = Complete, student not currently enrolled
//    |         |     |       |   D = Degree earned, not yet posted
//    |         |     |       |   Q = Currently enrolled, courses in progress NOT included
//    |         |     |       |   P = Currently enrolled, courses in progress included
//    |         |     |       |   X = Not available
// --|---------|-----|-------|--------------------------------------------------
//  5 | 23-23   |   1 | A     | Eligible to Return*
//    |         |     |       |   Y = Good standing, eligible to return
//    |         |     |       |   N = Not eligible, academic reasons
//    |         |     |       |   D = Not eligible, disciplinary reasons
//    |         |     |       |   B = Not eligible, both academic and disciplinary
//    |         |     |       |   X = Not available
// --|---------|-----|-------|--------------------------------------------------
//  6 | 24-24   |   1 | A     | Foreign Language Requirement*
//    |         |     |       |   Y/N/X/Z
// --|---------|-----|-------|--------------------------------------------------
//  7 | 25-25   |   1 | A     | Gordon Rule Requirement*
//    |         |     |       |   Y/N/X/Z
// --|---------|-----|-------|--------------------------------------------------
//  8 | 26-26   |   1 | A     | General Education Met*
//    |         |     |       |   A = AA requirements met (except CLAST, not valid after June 30, 2011)
//    |         |     |       |   Y = AA general education met (36 credit hours)
//    |         |     |       |   N = General education not met
//    |         |     |       |   S = AS/AAS general education met (Fall 2022+)
//    |         |     |       |   X = Not available
// --|---------|-----|-------|--------------------------------------------------
//  9 | 27-27   |   1 | A     | Immunization Record
//    |         |     |       |   Y/N/M/R/X
// 10 | 28-28   |   1 | A/N   | Basis of Admissions  0-5
// --|---------|-----|-------|--------------------------------------------------
// 11a| 29-29   |   1 | A     | Talented Twenty Status (7th Semester)  Y/N/blank
// 11b| 30-30   |   1 | A     | Civic Literacy Competency Indicator*  Y/N/Z
// 11c| 31-31   |   1 | A     | Reverse Transfer Award Code  A/B/Z/blank
// 11d| 32-32   |   1 | A     | Reverse Transfer Option  Y/N/blank
// 11e| 33-33   |   1 | A     | Civic Literacy Course Completion*  Y/N/Z/D
// 11f| 34-34   |   1 | A     | Civic Literacy Assessment Requirement*  Y/N/Z/D
// 11g| 35-35   |   1 | A     | General Education Digital Badge  A/Z
// 11h| 36-36   |   1 | A     | General Education Core Met*  Y/N/X
// 11i| 37-47   |  11 | A/N   | Filler
// --|---------|-----|-------|--------------------------------------------------
// 12 | 48-160  | 113 | A/N/L | Institution Mailing Address
//    | 48-82   |  35 |       |   Address Line 1
//    | 83-117  |  35 |       |   Address Line 2
//    | 118-147 |  30 |       |   City Name
//    | 148-149 |   2 |       |   State or Province
//    | 150-158 |   9 |       |   Postal Code
//    | 159-160 |   2 |       |   Country Code (ISO)
// --|---------|-----|-------|--------------------------------------------------
// 13 | 161-194 |  34 | A/N/L | Student's Place of Birth
//    | 161-190 |  30 |       |   City Name
//    | 191-192 |   2 |       |   State or Province
//    | 193-194 |   2 |       |   Country Code
// --|---------|-----|-------|--------------------------------------------------
// 14 | 195-244 |  50 | A/N/L | Name of High School Last Attended
// 15 | 245-245 |   1 | A/N   | Residency Code for Fee Purposes  Y/N/U
// --|---------|-----|-------|--------------------------------------------------
// 16 | 246-280 |  35 | A/N/L | Name of SPEEDE/ExPRESS Institution
// --|---------|-----|-------|--------------------------------------------------
// 17 | 281-294 |  14 | A/N/L | Identification Code of High School Last Attended
//    | 281-282 |   2 | A/N   |   Code Qualifier (73=OPEID, 77=NCES, 78=College Board, FD=Florida)
//    | 283-294 |  12 | A/N/L |   Code
// --|---------|-----|-------|--------------------------------------------------
// 18 | 295-296 |   2 | A/N   | Student's Country of Citizenship Code (ISO)
// 19 | 297-321 |  25 | A/N   | Institution Telephone Number
// 20 | 322-346 |  25 | A/N   | Institution Facsimile Number
// 21 | 347-396 |  50 | A/N   | Institution Electronic Mail Address
// --|---------|-----|-------|--------------------------------------------------
// 22 | 397-402 |   6 | N/R   | Cumulative Grade Point Average (999V99)
// 23 | 403-406 |   4 | A/N   | Filler
// 24 | 407-413 |   7 | A/N   | Filler
// 25 | 414-421 |   8 | N     | Date of Class Ranking (CCYYMMDD)
// --|---------|-----|-------|--------------------------------------------------
// 26 | 422-423 |   2 | N/R   | Citizenship Status Code
//    |         |     |       |   01=US Citizen  02=Non-Resident Alien  03=Resident Alien
//    |         |     |       |   04=Illegal Alien  05=Alien  06=US Citizen Non-Resident
//    |         |     |       |   07=US Citizen Resident
// --|---------|-----|-------|--------------------------------------------------
// 27 | 424-426 |   3 | A/N/L | Native Language of Student (ISO language code)
// 28 | 427-427 |   1 | A/N   | Language Proficiency Indicator
//    |         |     |       |   1=English Only  2=Fully English Proficient
//    |         |     |       |   3=Limited English Proficient  4=Non-English Speaking
//    |         |     |       |   5=Status Unknown  6=Redesignated Fluent
//    |         |     |       |   A=Excellent/Fluent  B=Good  C=Fair  D=Poor  E=Unacceptable
// --|---------|-----|-------|--------------------------------------------------
// 29 | 428-462 |  35 | A/N   | Administrative Contact Name
// --|---------|-----|-------|--------------------------------------------------
// 30 | 463-528 |  66 | A/N   | Student's Address
//    | 463-487 |  25 |       |   Address 1
//    | 488-497 |  10 |       |   Address 2
//    | 498-515 |  18 |       |   City
//    | 516-517 |   2 |       |   State/Province
//    | 518-526 |   9 |       |   Zip Code
//    | 527-528 |   2 |       |   Country
// --|---------|-----|-------|--------------------------------------------------
// 31 | 529-531 |   3 | A/N   | High School Graduation Type Code
//    |         |     |       |   B18=Standard  B19=Advanced/Honors  B20=Vocational
//    |         |     |       |   B21=Special Ed  B22=Certificate of Completion
//    |         |     |       |   B23=Special Certificate  B24=GED  B25=Other Equivalency
//    |         |     |       |   B26=International  087=College Ready
//    |         |     |       |   B27=Home Education  B28=PEP  WPR=Puerto Rico
// --|---------|-----|-------|--------------------------------------------------
// 32 | 532-539 |   8 | N/L   | Academic Credit Hours Attempted and in GPA  9(6)V99
// 33 | 540-547 |   8 | N/L   | Quality Points Used to Compute GPA  9(6)V99
// 34 | 548-553 |   6 | N/L   | Class Rank
// 35 | 554-559 |   6 | N/L   | Total Number in Class
// --|---------|-----|-------|--------------------------------------------------
// 36 | 560-561 |   2 | A/N   | Student Communication Number Qualifier 1
//    |         |     |       |   AP=Alternate Tel  CP=Cellular  EM=Email
//    |         |     |       |   HP=Home Phone  WP=Work Phone  (+ many more)
// 37 | 562-641 |  80 | A/N   | Student Communication Number 1
// 38 | 642-643 |   2 | A/N   | Student Communication Number Qualifier 2
// 39 | 644-723 |  80 | A/N   | Student Communication Number 2
// 40 | 724-725 |   2 | A/N   | Student Communication Number Qualifier 3
// 41 | 726-805 |  80 | A/N   | Student Communication Number 3
// 42 | 806-807 |   2 | A/N   | Student Communication Number Qualifier 4
// 43 | 808-887 |  80 | A/N>  | Student Communication Number 4
// --|---------|-----|-------|--------------------------------------------------
// 44 | 888-888 |   1 | A/N   | Academic Credit Type Code
//    |         |     |       |   A=Adult  C=CEU  G=Carnegie  N=No Credit
//    |         |     |       |   Q=Quarter Hour  S=Semester Hour  U=Units  V=Vocational  X=Other
// --|---------|-----|-------|--------------------------------------------------
// 45 | 889-890 |   2 | A/N   | Academic Summary Type
//    |         |     |       |   A = Summary of all courses at all institutions
//    |         |     |       |   E = Excluding repeated and/or forgiven courses
// --|---------|-----|-------|--------------------------------------------------
// 46 | 891-898 |   8 | N     | Academic Credit Hours Attempted or Paid For  9(6)V99
// 47 | 899-906 |   8 | N     | Academic Credit Hours Earned  9(6)V99
// 48 | 907-914 |   8 | N     | Lowest Possible Grade Point Average  9(6)V99
// 49 | 915-922 |   8 | N     | Highest Possible Grade Point Average  9(6)V99
// 50 | 923-923 |   1 | A/N   | Excessive GPA Indicator  Y/N
// 51 | 924-931 |   8 | A/N   | School Entry Date (CCYYMMDD)
// 52 | 932-939 |   8 | A/N   | School Exit Date (CCYYMMDD)
// --|---------|-----|-------|--------------------------------------------------
// 53 | 940-1011|  72 | A/N   | Filler
// 54 |1012-1020|   9 | A/N   | Filler Reserved for Local Use
// =============================================================================

// =============================================================================
// I/S03 - Student School Year Information
// Record Size: 1020
// =============================================================================
//
// # | Pos     | Len | Type  | Field Name (* = required)
// --|---------|-----|-------|--------------------------------------------------
//  1 | 1-3     |   3 | A/N   | Record Type*  I03/S03
//  2 | 4-13    |  10 | A/N/R | Student Number Identifier, Florida*
//  3 | 14-15   |   2 | A/N   | Filler
//  4 | 16-17   |   2 | N/R   | District Number, Current Enrollment*
//  5 | 18-21   |   4 | A/N/R | School Number, Current Enrollment*
//  6 | 22-27   |   6 | A/N   | Filler
//  7 | 28-35   |   8 | N     | School Year with Century* (CCYYCCYY e.g. 19831984)
//  8 | 36-38   |   3 | N/R   | Days Absent, Annual
//  9 | 39-41   |   3 | N/R   | Days Present, Annual
// 10 | 42-42   |   1 | A     | Grade Promotion Status  A/D/P/R/N/Z
// 11 | 43-842  | 800 | A/N   | Comment (10 lines x 80 chars)
// 12 | 843-845 |   3 | N/R   | Days Absent, Summer Terms
// 13 | 846-848 |   3 | N/R   | Days Present, Summer Terms
// 14a| 849-856 |   8 | A/N   | Migrant Enrollment Date (YYYYMMDD)
// 14b| 857-864 |   8 | A/N   | Migrant Withdrawal Date (YYYYMMDD)
// 14c| 865-866 |   2 | A/N   | Migrant District Attended
// 14d| 867-870 |   4 | A/N   | Migrant School Attended
// 14e| 871-871 |   1 | A/N   | Grade Promotion Status: Good Cause Exemption
// 14f| 872-899 |  28 | A/N   | Filler
// 15 | 900-904 |   5 | N     | GPA District, Term (NNNNN e.g. 32560 = 3.2560)
// 16 | 905-909 |   5 | N     | Quality Points District, Term
// 17 | 910-914 |   5 | N     | GPA District, Cumulative
// 18 | 915-919 |   5 | N     | Quality Points District, Cumulative
// 19 | 920-924 |   5 | N     | GPA State, Term (unweighted 4.0 scale)
// 20 | 925-929 |   5 | N     | Quality Points State, Term
// 21 | 930-934 |   5 | N     | GPA State, Cumulative (unweighted 4.0 scale)
// 22 | 935-939 |   5 | N     | Quality Points State, Cumulative
// 23 | 940-1011|  72 | A/N   | Filler
// 24 |1012-1020|   9 | A/N   | Filler Reserved for Local Use
// =============================================================================

// =============================================================================
// I/S04 - Student Course Information
// Record Size: 1020
// =============================================================================
//
// # | Pos     | Len | Type  | Field Name (* = required)
// --|---------|-----|-------|--------------------------------------------------
//  1 | 1-3     |   3 | A/N   | Record Type*  I04/S04
//  2 | 4-13    |  10 | A/N/R | Student Number Identifier, Florida*
//  3 | 14-15   |   2 | A/N   | Filler
//  4 | 16-17   |   2 | N/R   | District Number, Current Enrollment*
//  5 | 18-21   |   4 | A/N/R | School Number, Current Enrollment*
//  6 | 22-27   |   6 | A/N   | Filler
//  7 | 28-29   |   2 | A/N/R | District Number, Where Credit Earned*
//  8 | 30-33   |   4 | A/N/R | School Number, Where Credit Earned
// 8a | 30-33   |   4 | A/N/R | School Number, Where Course Taken
//  9 | 34-58   |  25 | A/N/L | School Name, Where Credit Earned
// 9a | 34-58   |  25 | A/N/L | School Name, Where Course Taken
// 10 | 59-66   |   8 | N     | School Year With Century* (CCYYCCYY)
// 11 | 67-68   |   2 | A/N   | Grade Level* (PK/KG/01-12/23/30/31)
// 12 | 69-69   |   1 | A/N   | Term* (1-9/B-O/S/T-Y)
// 13 | 70-76   |   7 | A/N   | Course Number*
// 14 | 77-96   |  20 | A/N/L | Course Title, Abbreviated*
// 15 | 97-98   |   2 | A     | Course, State Subject Area Requirements
// 16 | 99-102  |   4 | A/N   | Course Flag (up to 4 chars)
// 17 | 103-103 |   1 | A/N   | Online Course Indicator  Y/N/J/O/I
// 18 | 104-106 |   3 | A/N   | Credit Attempted, Course (NNN, e.g. 100=1.00)
// 19 | 107-109 |   3 | N     | Credit Earned, Course (NNN, e.g. 050=0.50)
// 20 | 110-112 |   3 | A/N/L | Course Grade (Final Grade Only)
// 21 | 113-115 |   3 | N/R   | Course In Progress Hours
// 22 | 116-118 |   3 | N/R   | Course Absences
// 23 | 119-120 |   2 | A/N/R | Weeks in Grading Cycle
// 24 | 121-123 |   3 | A/N/L | Course Grade - 1st Grading Block, 1st Period
// 25 | 124-126 |   3 | A/N/L | Course Grade - 1st Grading Block, 2nd Period
// 26 | 127-129 |   3 | A/N/L | Course Grade - 1st Grading Block, 3rd Period
// 27 | 130-132 |   3 | A/N/L | Course Grade - 1st Grading Block, Exam Grade
// 28 | 133-135 |   3 | A/N/L | Course Grade - 1st Grading Block, Cumulative
// 29 | 136-147 |  12 | A/N   | Filler
// 30 | 148-150 |   3 | A/N/L | Course Grade - 2nd Grading Block, 1st Period
// 31 | 151-153 |   3 | A/N/L | Course Grade - 2nd Grading Block, 2nd Period
// 32 | 154-156 |   3 | A/N/L | Course Grade - 2nd Grading Block, 3rd Period
// 33 | 157-159 |   3 | A/N/L | Course Grade - 2nd Grading Block, Exam Grade
// 34 | 160-162 |   3 | A/N/L | Course Grade - 2nd Grading Block, Cumulative
// 35 | 163-174 |  12 | A/N   | Filler
// 36-40 | 175-189 | (3x5) | A/N/L | Course Grade - 3rd Grading Block (5 fields)
// 41 | 190-201 |  12 | A/N   | Filler
// 42-46 | 202-216 | (3x5) | A/N/L | Course Grade - 4th Grading Block (5 fields)
// 47 | 217-228 |  12 | A/N   | Filler
// 48-52 | 229-243 | (3x5) | A/N/L | Course Grade - 5th Grading Block (5 fields)
// 53 | 244-255 |  12 | A/N   | Filler
// 54-58 | 256-270 | (3x5) | A/N/L | Course Grade - 6th Grading Block (5 fields)
// 59 | 271-299 |  29 | A/N   | Filler
// 60 | 300-399 | 100 | A/N   | SPEEDE/ExPRESS fields
//    | 300-334 |  35 |       |   Name of Term
//    | 335-342 |   8 |       |   Term Start Date (CCYYMMDD)
//    | 343-350 |   8 |       |   Term End Date (CCYYMMDD)
//    | 351-352 |   2 |       |   School Number Where Credit Earned Code Type
//    | 353-364 |  12 |       |   School Number Where Credit Earned Code
//    | 365-399 |  35 |       |   Filler
// 61 | 400-479 |  80 | A/N   | Filler
// 62 | 480-486 |   7 | A/N   | Course Number, Substituted
// 63 | 487-488 |   2 | A/N   | Course Substituted, State Subject Area Requirements
// 64 | 489-495 |   7 | A/N   | Adult General Education Program Code
// 65 | 496-496 |   1 | A/N   | Course Assessment Status (obsolete)
// 66 | 497-1011| 515 | A/N   | Filler
// 67 |1012-1020|   9 | A/N   | Filler Reserved for Local Use
// =============================================================================

// =============================================================================
// I/S05 - Student CTE/ELL/Dropout Information
// Record Size: 1020
// =============================================================================
//
// # | Pos     | Len | Type  | Field Name (* = required)
// --|---------|-----|-------|--------------------------------------------------
//  1 | 1-3     |   3 | A/N   | Record Type*  I05/S05
//  2 | 4-13    |  10 | A/N/R | Student Number Identifier, Florida*
//  3 | 14-15   |   2 | A/N   | Filler
//  4 | 16-17   |   2 | N/R   | District Number, Current Enrollment*
//  5 | 18-21   |   4 | A/N/R | School Number, Current Enrollment*
//  6 | 22-31   |  10 | A/N   | Filler
// CTE PROGRAM (1): items 7-10g (pos 32-96, 65 bytes)
//  7 | 32-38   |   7 | A/N   | CTE/Adult General Ed Program Code
//  8 | 39-58   |  20 | A/N/L | CTE/Adult General Ed Program Name, Abbreviated
//  9 | 59-59   |   1 | A     | Vocational Termination Code (obsolete)
// 10 | 60-67   |   8 | A/N   | Withdrawal Date (obsolete)
// 10a| 68-68   |   1 | A/N   | Program Completer  A/N/O/P/V/Z
// 10b| 69-75   |   7 | A/N   | Filler
// 10c| 76-76   |   1 | A     | Career and Professional Academy Participant  Y/N
// 10d| 77-84   |   8 | A/N   | Industry Certification Earned Date (MMDDCCYY)
// 10e| 85-92   |   8 | A/N   | Industry Certification Identifier
// 10f| 93-93   |   1 | A/N   | Industry Certification Outcome
// 10g| 94-96   |   3 | A/N   | Career and Professional Academy Identifier
// CTE PROGRAM (2): items 12-15g (pos 97-161, 65 bytes) - same structure
// CTE PROGRAM (3): items 17-20g (pos 162-226, 65 bytes)
// CTE PROGRAM (4): items 22-25g (pos 227-291, 65 bytes)
// 26-26c | 292-295 |   4 | A/N   | Career Pathways Participant (1-4) (obsolete)
// 26d| 296-427 | 132 | A/N   | Filler
// ELL SECTION (items 27-41a):
// 27 | 428-429 |   2 | A     | English Language Learners, PK-12  LY/LF/LP/LA/LZ/ZZ
// 28 | 430-430 |   1 | A     | ELL Basis of Entry  A/R/L/T/Z
// 29 | 431-438 |   8 | A/N   | ELL Entry Date (CCYYMMDD)
// 30 | 439-446 |   8 | A/N   | ELL Classification Date (CCYYMMDD)
// 31 | 447-454 |   8 | A/N   | ELL Student Plan Date (CCYYMMDD)
// 32 | 455-462 |   8 | A/N   | ELL Reevaluation Date (CCYYMMDD)
// 33 | 463-463 |   1 | A/N   | ELL Extension of Instruction  Y/Z
// 34 | 464-471 |   8 | A/N   | ELL Exit Date (CCYYMMDD)
// 35 | 472-479 |   8 | A/N   | ELL Reclassification Date (CCYYMMDD)
// 36 | 480-487 |   8 | A/N   | ELL Reclassification Exit Date (CCYYMMDD)
// 37 | 488-496 |   9 | A/N   | ELL Post Reclass Date (First Report Card) (ACCYYMMDD)
// 38 | 497-505 |   9 | A/N   | ELL Post Reclass Date (First Semiannual) (BCCYYMMDD)
// 39 | 506-514 |   9 | A/N   | ELL Post Reclass Date (Second Semiannual) (CCCYYMMDD)
// 40 | 515-523 |   9 | A/N   | ELL Post Reclass Date (End of Second Year) (DCCYYMMDD)
// 40a| 524-524 |   1 | A     | ELL First Basis of Exit  H/I/J/L/Z
// 40b| 525-525 |   1 | A     | ELL Second Basis of Exit  H/I/J/L/Z
// 41 | 526-526 |   1 | A/N   | ELL Program Participation  E/H/L/N/Z
// 41a| 527-929 | 403 | A/N   | Filler
// DROPOUT/JJ PROGRAM (1): items 42-44 (pos 930-938, 9 bytes)
// 42 | 930-930 |   1 | A     | Dropout Prevention/Juvenile Justice Programs
// 43 | 931-935 |   5 | A/N   | Dropout Prevention/JJ Placement Reasons
// 44 | 936-938 |   3 | A/N   | Dropout Prevention/JJ Outcomes
// DROPOUT/JJ PROGRAM (2): items 45-47 (pos 939-947, 9 bytes)
// 45 | 939-939 |   1 | A     | Dropout Prevention/JJ Programs (2)
// 46 | 940-944 |   5 | A/N   | Dropout Prevention/JJ Placement Reasons (2)
// 47 | 945-947 |   3 | A/N   | Dropout Prevention/JJ Outcomes (2)
// DROPOUT/JJ PROGRAM (3): items 48-50 (pos 948-956, 9 bytes)
// 48 | 948-948 |   1 | A     | Dropout Prevention/JJ Programs (3)
// 49 | 949-953 |   5 | A/N   | Dropout Prevention/JJ Placement Reasons (3)
// 50 | 954-956 |   3 | A/N   | Dropout Prevention/JJ Outcomes (3)
// 51 | 957-1011|  55 | A/N   | Filler
// 52 |1012-1020|   9 | A/N   | Filler Reserved for Local Use
// =============================================================================

// All FASTER records are exactly 1020 bytes
export const FASTER_RECORD_LENGTH = 1020;

// Error record uses a custom length (not a FASTER spec record)
const ERROR_CODE_LEN = 30;
const ERROR_MESSAGE_LEN = 80;
const ERROR_TIMESTAMP_LEN = 20;
export const ERR_LENGTH = 3 + 10 + ERROR_CODE_LEN + ERROR_MESSAGE_LEN + ERROR_TIMESTAMP_LEN;

/**
 * Parse student_full_name into FASTER name components.
 * Expected input format: "Last, First Middle" or "First Last" or similar.
 * Returns { lastName, appendage, firstName, middleName }.
 */
function parseStudentName(fullName: string | null | undefined): {
  lastName: string;
  appendage: string;
  firstName: string;
  middleName: string;
} {
  if (!fullName) return { lastName: '', appendage: '', firstName: '', middleName: '' };

  // Try "Last, First Middle" format first
  const commaIdx = fullName.indexOf(',');
  if (commaIdx !== -1) {
    const lastName = fullName.substring(0, commaIdx).trim();
    const rest = fullName.substring(commaIdx + 1).trim();
    const parts = rest.split(/\s+/);
    return {
      lastName,
      appendage: '',
      firstName: parts[0] || '',
      middleName: parts.slice(1).join(' '),
    };
  }

  // Fallback: "First Last" or "First Middle Last"
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0], appendage: '', firstName: '', middleName: '' };
  }
  if (parts.length === 2) {
    return { lastName: parts[1], appendage: '', firstName: parts[0], middleName: '' };
  }
  return {
    lastName: parts[parts.length - 1],
    appendage: '',
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
  };
}

/**
 * Format a student_number into FASTER Student Number Identifier format.
 * If it looks like an SSN (9 digits), append "X". Otherwise pad to 10.
 */
function formatStudentNumberId(studentNumber: string | null | undefined): string {
  const num = (studentNumber ?? '').replace(/\D/g, '');
  if (num.length === 9) return num + 'X';
  return studentNumber ?? '';
}

/**
 * Convert a date string to MMDDCCYY format for FASTER export.
 * Accepts ISO (YYYY-MM-DD), MM/DD/YYYY, or similar formats.
 */
function toMMDDCCYY(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return mm + dd + yyyy;
}

/**
 * Convert a date string to CCYYMMDD format for FASTER export.
 */
function toCCYYMMDD(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + mm + dd;
}

/**
 * Convert a GPA string (e.g. "3.625") to FASTER 5-digit format (e.g. "36250").
 * FASTER uses NNNNN with 4 implied decimal places on a 4.0 scale.
 */
function formatGpa(gpaStr: string | null | undefined): string | null {
  if (!gpaStr) return null;
  const gpa = parseFloat(gpaStr);
  if (isNaN(gpa)) return null;
  return String(Math.round(gpa * 10000)).padStart(5, '0');
}

/**
 * Strip non-digit characters from a phone number for FASTER export.
 */
function stripPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

// =============================================================================
// S01 - Student Demographic Information (1020 bytes)
// =============================================================================

/**
 * S01 - Student Demographic Information (I/S01 format)
 *
 * See I/S01 field reference above for complete field layout.
 * Record Size: 1020 bytes. Fields with available enrollment data are wired in;
 * remaining fields are filled with spaces (null).
 */
export function buildS01Record(enrollment: Enrollment): string {
  const name = parseStudentName(enrollment.student_full_name);
  const studentId = formatStudentNumberId(enrollment.student_number);
  const birthDateCCYYMMDD = toCCYYMMDD(enrollment.student_birth_date);
  const gradDateMMDDCCYY = toMMDDCCYY(enrollment.graduation_date);
  const gpa = formatGpa(enrollment.gpa);
  // Access transcript JSONB for school phone if available
  const transcript = enrollment.transcript as any;
  const schoolPhone = stripPhone(transcript?.schoolPhone ?? null);

  return [
    field(3, 'S01'),                                 //  1: Record Type*
    field(10, studentId),                             //  2: Student Number Identifier, Florida*
    field(2, null),                                   //  3: Filler
    numField(2, null),                                //  4: District Number, Current Enrollment* (2, N/R) - FL district code
    field(4, null),                                   //  5: School Number, Current Enrollment* (4, A/N/R) - FL school code
    field(10, null),                                  //  6: Filler
    field(10, null),                                  //  7: Student Number Identifier-Alias (10, A/N/R) - alternate SSN/ID
    field(5, null),                                   //  8: Filler
    // Item 9: Student Name, Legal (42 = 17+3+12+10)
    field(17, name.lastName),                          //  9a: Last Name
    field(3, name.appendage),                          //  9b: Appendage (Jr, Sr, III)
    field(12, name.firstName),                         //  9c: First Name
    field(10, name.middleName),                        //  9d: Middle/Maiden Name
    field(1, null),                                   // 10: Ethnicity (1, A/N) Y/N - Hispanic/Latino indicator
    field(1, null),                                   // 10a: Race: American Indian/Alaska Native (1, A/N) Y/N
    field(1, null),                                   // 10b: Race: Asian (1, A/N) Y/N
    field(1, null),                                   // 10c: Race: Black or African American (1, A/N) Y/N
    field(1, null),                                   // 10d: Race: Native Hawaiian/Pacific Islander (1, A/N) Y/N
    field(1, null),                                   // 10e: Race: White (1, A/N) Y/N
    field(1, enrollment.student_sex),                  // 11: Sex* (1, A) M/F
    field(1, null),                                   // 12: Racial/Ethnic Category (1, A) W/B/H/A/I/M
    field(12, null),                                  // 13: MSIX ID (12, A/N) - migrant student ID
    field(1, null),                                   // 14: Migrant Status Term (1, A/N)
    field(2, null),                                   // 15: Migrant Birth State (2, A/N)
    field(1, null),                                   // 15a: Military Family Student (1, A/N) Y/N/Z
    field(2, enrollment.grade_level),                  // 16: Grade Level* (2, A/N) PK/KG/01-12/23/30/31
    field(1, null),                                   // 17: Filler
    field(1, null),                                   // 17a: Migrant Summer Term (1, A/N) S/blank
    field(1, null),                                   // 17b: Migrant Annual Term (1, A/N) 3/blank
    field(3, null),                                   // 18: Filler
    field(1, null),                                   // 18a: Diploma Designation* (1, A/N) S/M/I/B/Z
    field(1, null),                                   // 18b: Graduation Option (1, A/N)
    field(8, null),                                   // 19a: Min Exceptional Student Ed Date (8, A/N) MMDDCCYY
    field(8, null),                                   // 19b: MEP Enrollment Date* (8, A/N) MMDDCCYY
    field(8, null),                                   // 19c: Year Entered Ninth Grade (8, A/N) CCYYCCYY
    field(1, null),                                   // 19d: National Merit Scholar (1, A/N) S/F/Z
    field(1, null),                                   // 19e: National Achievement Scholar (1, A/N) S/F/Z
    field(6, null),                                   // 19f: Communications, Date Passed (6, A/N) MMCCYY
    field(6, null),                                   // 19g: Mathematics, Date Passed (6, A/N) MMCCYY
    field(1, null),                                   // 19h: National Hispanic Scholar (1, A/N) S/Z
    field(53, null),                                  // 20: Filler
    // Item 21: Address, Mailing (64 = 25+10+20+9) - we dump full address into 64
    field(64, enrollment.student_address),              // 21: Address, Mailing*
    field(168, null),                                 // 22: Student Name, AKA (168, A/N/L) - 4 x 42-char alias names
    field(1, null),                                   // 23: Birth Date Verification (1, A/N) 1-9/T
    field(18, null),                                  // 24: Birth Place (18, A/N) - free form text
    field(1, null),                                   // 25: Female Parent/Guardian Code (1, A) P/G/O/A/S/N
    field(25, null),                                  // 26: Female Parent/Guardian Name (25, A/N)
    field(1, null),                                   // 27: Male Parent/Guardian Code (1, A) P/G/O/A/S/N
    field(25, null),                                  // 28: Male Parent/Guardian Name (25, A/N)
    field(1, null),                                   // 29: Parent/Guardian Code (1, A) M/F
    field(25, null),                                  // 30: Parent/Guardian Name (25, A/N)
    field(1, null),                                   // 31a: Health Exam, School Entry (1, A) Y/T/R/N/V
    field(1, null),                                   // 31b: 911 Medical Alert (1, A) Y/N
    field(45, null),                                  // 31c: 911 Contact (45, A/N/L) - name/phone
    field(2, null),                                   // 31d: Screening for Hearing (2, A) HY/HT/HN/ZZ
    field(2, null),                                   // 31e: Screening for Vision (2, A) VY/VT/VN/ZZ
    field(55, null),                                  // 32: Filler
    field(25, enrollment.school_name),                 // 33: School Name, Current* (25, A/N/L)
    field(65, enrollment.school_address),               // 34: School Address, Current (65, A/N/L)
    field(10, schoolPhone),                            // 35: School Phone Number* (10, N) - digits only
    field(1, null),                                   // 36a: Migrant Continuation of Services (1, A/N) A/B/C/Z
    field(1, null),                                   // 36b: Migrant Priority for Services (1, A/N) Y/N/Z
    field(1, null),                                   // 36c: Filler
    field(1, null),                                   // 36d: Residency for Tuition Purposes (1, A/N) D/F/N/Z
    field(1, null),                                   // 36e: Online Course Exempt (1, A/N) D/T/Z
    field(2, null),                                   // 36f: Adult Fee Status (2, A/N)
    field(1, null),                                   // 36g: Filler
    field(3, null),                                   // 37: Withdrawal Code (3, A/N)
    field(8, null),                                   // 38: Withdrawal Date (8, A/N) MMDDCCYY
    field(84, null),                                  // 39: Credits Needed, Local Subject Area (84 = 21x4, N/R)
    field(19, null),                                  // 39x: Filler (reserved for future assessment)
    field(1, null),                                   // 39g: Civic Literacy Assessment Passed (1, A/N) Y/N/blank
    field(1, null),                                   // 39f: ELA Assessment Passed Met (1, A/N) Y/N/Z
    field(1, null),                                   // 39a: Algebra 2 Assessment Passed (1, A/N) Y/E/blank
    field(1, null),                                   // 39b: Algebra 1 Assessment Met (1, A/N) Y/E/N/Z
    field(1, null),                                   // 39c: Geometry Assessment Passed (1, A/N) Y/E/blank
    field(1, null),                                   // 39d: Biology Assessment Passed (1, A/N) Y/E/blank
    field(1, null),                                   // 39e: U.S. History Assessment Passed (1, A/N) Y/E/blank
    numField(6, null),                                // 40: Class Rank, Numerical Position (6, N/R)
    numField(2, null),                                // 41: Class Rank, Percentile (2, N/R)
    numField(6, null),                                // 42: Class Rank, Total Number (6, N/R)
    field(5, gpa),                                    // 43: GPA District, Cumulative (5, N) NNNNN
    field(5, gpa),                                    // 44: GPA State, Cumulative* (5, N) NNNNN
    field(8, gradDateMMDDCCYY),                        // 45: Diploma Date (8, N) MMDDCCYY
    field(3, null),                                   // 46: Diploma Type (3, A/N)
    field(8, null),                                   // 47: Certificate of Completion, Date (8, N) (obsolete)
    field(3, null),                                   // 48: Certificate of Completion, Type (3, A/N) (obsolete)
    field(8, null),                                   // 49: Class Rank, Effective Date (8, A/N) MMDDCCYY
    field(2, null),                                   // 50: Native Language, Student (2, A/N) NN/ZZ
    field(8, null),                                   // 51: ELL Home Language Survey Date (8, A/N) CCYYMMDD
    field(2, null),                                   // 52: Country of Birth (2, A/N) - ISO country code
    field(2, null),                                   // 53: Parent/Guardian Home Language (2, A/N)
    field(2, null),                                   // 54: Graduation Requirement Basis (2, A/N)
    field(8, birthDateCCYYMMDD),                       // 55: Birth Date* (8, N) CCYYMMDD
    field(1, null),                                   // 56: Resident Status (1, A/N) 0/A/B/2-7/Z
    field(1, null),                                   // 57: Multiple Birth Student (1, A/N) Y/N/Z
    field(2, null),                                   // 57a: Filler
    field(1, null),                                   // 58: Even Start Family Literacy (1, A/N) Y/N/Z
    field(1, null),                                   // 59: Florida First Start Program (1, A/N) Y/N/Z
    field(1, null),                                   // 60: Fine Arts Seal (1, A/N) Y/Z
    field(1, null),                                   // 61: Program Participation Prior to KG (1, A/N) (discontinued)
    field(1, null),                                   // 62: Differentiated Diploma (1, A/N) 1/Z
    field(1, null),                                   // 63: International Baccalaureate Diploma (1, A/N) Y/N/Z
    field(1, null),                                   // 64: College Ready Diploma (1, A/N) Y/N/Z
    field(1, null),                                   // 65: AICE Certificate (1, A/N) Y/N/Z
    field(1, null),                                   // 66: District Community/Volunteer Service (1, A/N) Y/N/Z/blank
    field(1, null),                                   // 67: Early Admission Student (1, A/N) Y/Z
    field(1, null),                                   // 68: Additional School Year Student (1, A/N)
    field(1, null),                                   // 69: AICE Diploma (1, A/N) Y/N/Z
    field(1, null),                                   // 70: Biliteracy Seal (1, A/N) G/S/B/Z
    numField(4, null),                                // 71: Paid Work Hours (4, N/R)
    field(4, null),                                   // 71a: Filler
    numField(4, null),                                // 72: Volunteer Service Hours (4, N/R)
    field(1, null),                                   // 73: Physical Education Waiver (1, A/N) Y/N/Z
    field(21, null),                                  // 74: Filler
    field(9, null),                                   // 75: Filler Reserved for Local Use
  ].join('');
}

// =============================================================================
// I/S03 - Student School Year Information (1020 bytes)
// =============================================================================

/**
 * S03 - Student School Year Information (I/S03 format)
 *
 * See I/S03 field reference above. Record Size: 1020 bytes.
 * One record per school year for non-migrant students.
 */
export function buildS03Record(
  enrollment: Enrollment,
  term: FasterTermData,
): string {
  const studentId = formatStudentNumberId(enrollment.student_number);
  const gpa = formatGpa(enrollment.gpa);
  // TermDto has termGpa which would be term-level GPA
  const termGpa = formatGpa((term as any).termGpa ?? null);

  return [
    field(3, 'S03'),                                 //  1: Record Type*
    field(10, studentId),                             //  2: Student Number Identifier, Florida*
    field(2, null),                                   //  3: Filler
    numField(2, null),                                //  4: District Number, Current Enrollment* (2, N/R)
    field(4, null),                                   //  5: School Number, Current Enrollment* (4, A/N/R)
    field(6, null),                                   //  6: Filler
    field(8, term.termYear),                           //  7: School Year with Century* (8, N) CCYYCCYY
    numField(3, null),                                //  8: Days Absent, Annual (3, N/R)
    numField(3, null),                                //  9: Days Present, Annual (3, N/R)
    field(1, null),                                   // 10: Grade Promotion Status (1, A) A/D/P/R/N/Z
    field(800, null),                                 // 11: Comment (800, A/N) - 10 lines x 80 chars
    numField(3, null),                                // 12: Days Absent, Summer Terms (3, N/R)
    numField(3, null),                                // 13: Days Present, Summer Terms (3, N/R)
    field(8, null),                                   // 14a: Migrant Enrollment Date (8, A/N) YYYYMMDD
    field(8, null),                                   // 14b: Migrant Withdrawal Date (8, A/N) YYYYMMDD
    field(2, null),                                   // 14c: Migrant District Attended (2, A/N)
    field(4, null),                                   // 14d: Migrant School Attended (4, A/N)
    field(1, null),                                   // 14e: Grade Promotion Status: Good Cause Exemption (1, A/N)
    field(28, null),                                  // 14f: Filler
    field(5, termGpa),                                // 15: GPA District, Term (5, N) NNNNN
    field(5, null),                                   // 16: Quality Points District, Term (5, N)
    field(5, gpa),                                    // 17: GPA District, Cumulative (5, N)
    field(5, null),                                   // 18: Quality Points District, Cumulative (5, N)
    field(5, termGpa),                                // 19: GPA State, Term (5, N) - unweighted 4.0
    field(5, null),                                   // 20: Quality Points State, Term (5, N)
    field(5, gpa),                                    // 21: GPA State, Cumulative (5, N)
    field(5, null),                                   // 22: Quality Points State, Cumulative (5, N)
    field(72, null),                                  // 23: Filler
    field(9, null),                                   // 24: Filler Reserved for Local Use
  ].join('');
}

// =============================================================================
// I/S04 - Student Course Information (1020 bytes)
// =============================================================================

/**
 * S04 - Student Course Information (I/S04 format)
 *
 * See I/S04 field reference above. Record Size: 1020 bytes.
 * One record per course per year (or per credit earned period per year).
 */
export function buildS04Record(
  enrollment: Enrollment,
  term: FasterTermData,
  course: FasterCourseData,
): string {
  const studentId = formatStudentNumberId(enrollment.student_number);
  // Map DTO's creditEarned (e.g. "1.00") to NNN format (e.g. "100")
  const creditEarnedNum = course.creditEarned ? String(Math.round(parseFloat(course.creditEarned) * 100)).padStart(3, '0') : null;

  return [
    field(3, 'S04'),                                 //  1: Record Type*
    field(10, studentId),                             //  2: Student Number Identifier, Florida*
    field(2, null),                                   //  3: Filler
    numField(2, null),                                //  4: District Number, Current Enrollment* (2, N/R)
    field(4, null),                                   //  5: School Number, Current Enrollment* (4, A/N/R)
    field(6, null),                                   //  6: Filler
    numField(2, null),                                //  7: District Number, Where Credit Earned* (2, A/N/R)
    field(4, null),                                   //  8: School Number, Where Credit Earned (4, A/N/R)
    field(25, enrollment.school_name),                 //  9: School Name, Where Credit Earned (25, A/N/L)
    field(8, term.termYear),                           // 10: School Year With Century* (8, N) CCYYCCYY
    field(2, enrollment.grade_level),                  // 11: Grade Level* (2, A/N)
    field(1, term.termSeason),                         // 12: Term* (1, A/N) - 1-9/B-O/S/T-Y
    field(7, course.courseCode),                       // 13: Course Number* (7, A/N)
    field(20, course.courseTitle),                      // 14: Course Title, Abbreviated* (20, A/N/L)
    field(2, null),                                   // 15: Course, State Subject Area Requirements (2, A)
    field(4, null),                                   // 16: Course Flag (4, A/N) - *=sub, G=gifted, H=honors, etc.
    field(1, null),                                   // 17: Online Course Indicator (1, A/N) Y/N/J/O/I
    field(3, creditEarnedNum),                         // 18: Credit Attempted, Course (3, A/N) NNN
    field(3, creditEarnedNum),                         // 19: Credit Earned, Course (3, N) NNN
    field(3, course.grade),                            // 20: Course Grade (Final Grade Only) (3, A/N/L)
    numField(3, null),                                // 21: Course In Progress Hours (3, N/R)
    numField(3, null),                                // 22: Course Absences (3, N/R)
    field(2, null),                                   // 23: Weeks in Grading Cycle (2, A/N/R)
    // Grading blocks 1-6 (items 24-58): 5 grades per block + 12-char filler between each
    // Block 1 (items 24-28)
    field(3, null),                                   // 24: 1st Block, 1st Grading Period (3, A/N/L)
    field(3, null),                                   // 25: 1st Block, 2nd Grading Period (3, A/N/L)
    field(3, null),                                   // 26: 1st Block, 3rd Grading Period (3, A/N/L)
    field(3, null),                                   // 27: 1st Block, Exam Grade (3, A/N/L)
    field(3, null),                                   // 28: 1st Block, Cumulative Grade (3, A/N/L)
    field(12, null),                                  // 29: Filler
    // Block 2 (items 30-34)
    field(3, null),                                   // 30: 2nd Block, 1st Grading Period
    field(3, null),                                   // 31: 2nd Block, 2nd Grading Period
    field(3, null),                                   // 32: 2nd Block, 3rd Grading Period
    field(3, null),                                   // 33: 2nd Block, Exam Grade
    field(3, null),                                   // 34: 2nd Block, Cumulative Grade
    field(12, null),                                  // 35: Filler
    // Block 3 (items 36-40)
    field(3, null),                                   // 36: 3rd Block, 1st Grading Period
    field(3, null),                                   // 37: 3rd Block, 2nd Grading Period
    field(3, null),                                   // 38: 3rd Block, 3rd Grading Period
    field(3, null),                                   // 39: 3rd Block, Exam Grade
    field(3, null),                                   // 40: 3rd Block, Cumulative Grade
    field(12, null),                                  // 41: Filler
    // Block 4 (items 42-46)
    field(3, null),                                   // 42: 4th Block, 1st Grading Period
    field(3, null),                                   // 43: 4th Block, 2nd Grading Period
    field(3, null),                                   // 44: 4th Block, 3rd Grading Period
    field(3, null),                                   // 45: 4th Block, Exam Grade
    field(3, null),                                   // 46: 4th Block, Cumulative Grade
    field(12, null),                                  // 47: Filler
    // Block 5 (items 48-52)
    field(3, null),                                   // 48: 5th Block, 1st Grading Period
    field(3, null),                                   // 49: 5th Block, 2nd Grading Period
    field(3, null),                                   // 50: 5th Block, 3rd Grading Period
    field(3, null),                                   // 51: 5th Block, Exam Grade
    field(3, null),                                   // 52: 5th Block, Cumulative Grade
    field(12, null),                                  // 53: Filler
    // Block 6 (items 54-58)
    field(3, null),                                   // 54: 6th Block, 1st Grading Period
    field(3, null),                                   // 55: 6th Block, 2nd Grading Period
    field(3, null),                                   // 56: 6th Block, 3rd Grading Period
    field(3, null),                                   // 57: 6th Block, Exam Grade
    field(3, null),                                   // 58: 6th Block, Cumulative Grade
    field(29, null),                                  // 59: Filler
    // SPEEDE/ExPRESS fields (item 60, 100 bytes total)
    field(35, null),                                  // 60a: Name of Term (35, A/N)
    field(8, null),                                   // 60b: Term Start Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 60c: Term End Date (8, A/N) CCYYMMDD
    field(2, null),                                   // 60d: School Number Where Credit Earned Code Type (2, A/N)
    field(12, null),                                  // 60e: School Number Where Credit Earned Code (12, A/N)
    field(35, null),                                  // 60f: Filler
    field(80, null),                                  // 61: Filler
    field(7, null),                                   // 62: Course Number, Substituted (7, A/N)
    field(2, null),                                   // 63: Course Substituted, State Subject Area (2, A/N)
    field(7, null),                                   // 64: Adult General Education Program Code (7, A/N)
    field(1, null),                                   // 65: Course Assessment Status (1, A/N) (obsolete)
    field(515, null),                                 // 66: Filler
    field(9, null),                                   // 67: Filler Reserved for Local Use
  ].join('');
}

// =============================================================================
// I/S05 - Student CTE/ELL/Dropout Information (1020 bytes)
// =============================================================================

/**
 * S05 - Student CTE/ELL/Dropout Information (I/S05 format)
 *
 * See I/S05 field reference above. Record Size: 1020 bytes.
 * For S05 (secondary transcripts), items 1-25 and 52 are valid.
 * Most fields relate to CTE programs, ELL, and dropout prevention which
 * we don't currently have data for.
 */
export function buildS05Record(enrollment: Enrollment): string {
  const studentId = formatStudentNumberId(enrollment.student_number);

  return [
    field(3, 'S05'),                                 //  1: Record Type*
    field(10, studentId),                             //  2: Student Number Identifier, Florida*
    field(2, null),                                   //  3: Filler
    numField(2, null),                                //  4: District Number, Current Enrollment* (2, N/R)
    field(4, null),                                   //  5: School Number, Current Enrollment* (4, A/N/R)
    field(10, null),                                  //  6: Filler
    // CTE PROGRAM (1): 65 bytes (items 7-10g)
    field(7, null),                                   //  7: CTE Program Code (7, A/N) - 7-digit program number
    field(20, null),                                  //  8: CTE Program Name, Abbreviated (20, A/N/L)
    field(1, null),                                   //  9: Vocational Termination Code (1, A) (obsolete)
    field(8, null),                                   // 10: Withdrawal Date (8, A/N) (obsolete)
    field(1, null),                                   // 10a: Program Completer (1, A/N) A/N/O/P/V/Z
    field(7, null),                                   // 10b: Filler
    field(1, null),                                   // 10c: Career/Professional Academy Participant (1, A) Y/N
    field(8, null),                                   // 10d: Industry Certification Earned Date (8, A/N) MMDDCCYY
    field(8, null),                                   // 10e: Industry Certification Identifier (8, A/N)
    field(1, null),                                   // 10f: Industry Certification Outcome (1, A/N)
    field(3, null),                                   // 10g: Career/Professional Academy Identifier (3, A/N)
    // CTE PROGRAM (2): 65 bytes (items 12-15g) - same structure
    field(7, null),                                   // 12: CTE Program Code (2)
    field(20, null),                                  // 13: CTE Program Name (2)
    field(1, null),                                   // 14: Vocational Termination Code (2) (obsolete)
    field(8, null),                                   // 15: Withdrawal Date (2) (obsolete)
    field(1, null),                                   // 15a: Program Completer (2)
    field(7, null),                                   // 15b: Filler
    field(1, null),                                   // 15c: Career/Professional Academy Participant (2)
    field(8, null),                                   // 15d: Industry Certification Earned Date (2)
    field(8, null),                                   // 15e: Industry Certification Identifier (2)
    field(1, null),                                   // 15f: Industry Certification Outcome (2)
    field(3, null),                                   // 15g: Career/Professional Academy Identifier (2)
    // CTE PROGRAM (3): 65 bytes (items 17-20g)
    field(7, null),                                   // 17: CTE Program Code (3)
    field(20, null),                                  // 18: CTE Program Name (3)
    field(1, null),                                   // 19: Vocational Termination Code (3) (obsolete)
    field(8, null),                                   // 20: Withdrawal Date (3) (obsolete)
    field(1, null),                                   // 20a: Program Completer (3)
    field(7, null),                                   // 20b: Filler
    field(1, null),                                   // 20c: Career/Professional Academy Participant (3)
    field(8, null),                                   // 20d: Industry Certification Earned Date (3)
    field(8, null),                                   // 20e: Industry Certification Identifier (3)
    field(1, null),                                   // 20f: Industry Certification Outcome (3)
    field(3, null),                                   // 20g: Career/Professional Academy Identifier (3)
    // CTE PROGRAM (4): 65 bytes (items 22-25g)
    field(7, null),                                   // 22: CTE Program Code (4)
    field(20, null),                                  // 23: CTE Program Name (4)
    field(1, null),                                   // 24: Vocational Termination Code (4) (obsolete)
    field(8, null),                                   // 25: Withdrawal Date (4) (obsolete)
    field(1, null),                                   // 25a: Program Completer (4)
    field(7, null),                                   // 25b: Filler
    field(1, null),                                   // 25c: Career/Professional Academy Participant (4)
    field(8, null),                                   // 25d: Industry Certification Earned Date (4)
    field(8, null),                                   // 25e: Industry Certification Identifier (4)
    field(1, null),                                   // 25f: Industry Certification Outcome (4)
    field(3, null),                                   // 25g: Career/Professional Academy Identifier (4)
    // Career Pathways Participant indicators (obsolete)
    field(1, null),                                   // 26: Career Pathways Participant (1) (1, A/N) (obsolete)
    field(1, null),                                   // 26a: Career Pathways Participant (2) (obsolete)
    field(1, null),                                   // 26b: Career Pathways Participant (3) (obsolete)
    field(1, null),                                   // 26c: Career Pathways Participant (4) (obsolete)
    field(132, null),                                 // 26d: Filler
    // ELL Section (items 27-41a)
    field(2, null),                                   // 27: English Language Learners, PK-12 (2, A) LY/LF/LP/LA/LZ/ZZ
    field(1, null),                                   // 28: ELL Basis of Entry (1, A) A/R/L/T/Z
    field(8, null),                                   // 29: ELL Entry Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 30: ELL Classification Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 31: ELL Student Plan Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 32: ELL Reevaluation Date (8, A/N) CCYYMMDD
    field(1, null),                                   // 33: ELL Extension of Instruction (1, A/N) Y/Z
    field(8, null),                                   // 34: ELL Exit Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 35: ELL Reclassification Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 36: ELL Reclassification Exit Date (8, A/N) CCYYMMDD
    field(9, null),                                   // 37: ELL Post Reclass Date (1st Report) (9, A/N) ACCYYMMDD
    field(9, null),                                   // 38: ELL Post Reclass Date (1st Semi) (9, A/N) BCCYYMMDD
    field(9, null),                                   // 39: ELL Post Reclass Date (2nd Semi) (9, A/N) CCCYYMMDD
    field(9, null),                                   // 40: ELL Post Reclass Date (End 2nd Yr) (9, A/N) DCCYYMMDD
    field(1, null),                                   // 40a: ELL First Basis of Exit (1, A) H/I/J/L/Z
    field(1, null),                                   // 40b: ELL Second Basis of Exit (1, A) H/I/J/L/Z
    field(1, null),                                   // 41: ELL Program Participation (1, A/N) E/H/L/N/Z
    field(403, null),                                 // 41a: Filler
    // Dropout Prevention/JJ Program (1): 9 bytes
    field(1, null),                                   // 42: Dropout Prevention/JJ Programs (1, A)
    field(5, null),                                   // 43: Dropout Prevention/JJ Placement Reasons (5, A/N)
    field(3, null),                                   // 44: Dropout Prevention/JJ Outcomes (3, A/N)
    // Dropout Prevention/JJ Program (2): 9 bytes
    field(1, null),                                   // 45: Dropout Prevention/JJ Programs (2) (1, A)
    field(5, null),                                   // 46: Dropout Prevention/JJ Placement Reasons (2) (5, A/N)
    field(3, null),                                   // 47: Dropout Prevention/JJ Outcomes (2) (3, A/N)
    // Dropout Prevention/JJ Program (3): 9 bytes
    field(1, null),                                   // 48: Dropout Prevention/JJ Programs (3) (1, A)
    field(5, null),                                   // 49: Dropout Prevention/JJ Placement Reasons (3) (5, A/N)
    field(3, null),                                   // 50: Dropout Prevention/JJ Outcomes (3) (3, A/N)
    field(55, null),                                  // 51: Filler
    field(9, null),                                   // 52: Filler Reserved for Local Use
  ].join('');
}

// =============================================================================
// P01 - Postsecondary Demographic Information (1020 bytes)
// =============================================================================

/**
 * P01 - Postsecondary Demographic Information
 *
 * See P01 field reference above. Record Size: 1020 bytes.
 */
export function buildP01Record(enrollment: Enrollment): string {
  const ssnPart = (enrollment.student_ssn ?? '').replace(/\D/g, '');
  const now = new Date();
  const datePrepared = String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + String(now.getFullYear());
  const gpa = formatGpa(enrollment.gpa);

  return [
    field(3, 'P01'),                                 //  1: Record Type*
    // Item 2: SSN (9) + Filler (1) = 10
    field(9, ssnPart),                                //  2a: Social Security Number (9, N)
    field(1, null),                                   //  2b: Filler
    field(8, datePrepared),                            //  3: Date Prepared* (8, N) MMDDCCYY
    field(1, null),                                   //  4: Transcript Status* (1, A) Y/D/Q/P/X
    field(1, null),                                   //  5: Eligible to Return* (1, A) Y/N/D/B/X
    field(1, null),                                   //  6: Foreign Language Requirement* (1, A) Y/N/X/Z
    field(1, null),                                   //  7: Gordon Rule Requirement* (1, A) Y/N/X/Z
    field(1, null),                                   //  8: General Education Met* (1, A) A/Y/N/S/X
    field(1, null),                                   //  9: Immunization Record (1, A) Y/N/M/R/X
    field(1, null),                                   // 10: Basis of Admissions (1, A/N) 0-5
    field(1, null),                                   // 11a: Talented Twenty Status (1, A) Y/N/blank
    field(1, null),                                   // 11b: Civic Literacy Competency* (1, A) Y/N/Z
    field(1, null),                                   // 11c: Reverse Transfer Award Code (1, A) A/B/Z/blank
    field(1, null),                                   // 11d: Reverse Transfer Option (1, A) Y/N/blank
    field(1, null),                                   // 11e: Civic Literacy Course Completion* (1, A) Y/N/Z/D
    field(1, null),                                   // 11f: Civic Literacy Assessment Req* (1, A) Y/N/Z/D
    field(1, null),                                   // 11g: General Ed Digital Badge (1, A) A/Z
    field(1, null),                                   // 11h: General Education Core Met* (1, A) Y/N/X
    field(11, null),                                  // 11i: Filler
    // Item 12: Institution Mailing Address (113 = 35+35+30+2+9+2)
    field(35, enrollment.school_address),               // 12a: Address Line 1
    field(35, null),                                  // 12b: Address Line 2
    field(30, null),                                  // 12c: City Name
    field(2, null),                                   // 12d: State or Province
    field(9, null),                                   // 12e: Postal Code
    field(2, null),                                   // 12f: Country Code (ISO)
    // Item 13: Student's Place of Birth (34 = 30+2+2)
    field(30, null),                                  // 13a: City Name (30, A/N/L)
    field(2, null),                                   // 13b: State or Province
    field(2, null),                                   // 13c: Country Code
    field(50, null),                                  // 14: Name of High School Last Attended (50, A/N/L)
    field(1, null),                                   // 15: Residency Code for Fee Purposes (1, A/N) Y/N/U
    field(35, null),                                  // 16: Name of SPEEDE/ExPRESS Institution (35, A/N/L)
    // Item 17: HS Identification Code (14 = 2+12)
    field(2, null),                                   // 17a: Code Qualifier (2, A/N) 73/77/78/FD
    field(12, null),                                  // 17b: Code (12, A/N/L)
    field(2, null),                                   // 18: Student Country of Citizenship (2, A/N) ISO
    field(25, null),                                  // 19: Institution Telephone Number (25, A/N)
    field(25, null),                                  // 20: Institution Facsimile Number (25, A/N)
    field(50, null),                                  // 21: Institution Email Address (50, A/N)
    numField(6, gpa ? gpa.substring(0, 5) + '0' : null), // 22: Cumulative GPA (6, N/R) 999V99
    field(4, null),                                   // 23: Filler
    field(7, null),                                   // 24: Filler
    field(8, null),                                   // 25: Date of Class Ranking (8, N) CCYYMMDD
    numField(2, null),                                // 26: Citizenship Status Code (2, N/R) 01-07
    field(3, null),                                   // 27: Native Language of Student (3, A/N/L) ISO
    field(1, null),                                   // 28: Language Proficiency Indicator (1, A/N) 1-6/A-E
    field(35, null),                                  // 29: Administrative Contact Name (35, A/N)
    // Item 30: Student's Address (66 = 25+10+18+2+9+2)
    field(66, enrollment.student_address),              // 30: Student's Address (66, A/N) - full address
    field(3, null),                                   // 31: HS Graduation Type Code (3, A/N) B18-B28/087/WPR
    field(8, null),                                   // 32: Academic Credit Hours Attempted in GPA (8, N/L) 9(6)V99
    field(8, null),                                   // 33: Quality Points Used to Compute GPA (8, N/L) 9(6)V99
    numField(6, null),                                // 34: Class Rank (6, N/L)
    numField(6, null),                                // 35: Total Number in Class (6, N/L)
    // Communication Numbers (4 sets of qualifier + number)
    field(2, 'HP'),                                   // 36: Comm Number Qualifier 1 (2, A/N) - Home Phone
    field(80, enrollment.student_phone),                // 37: Comm Number 1 (80, A/N)
    field(2, 'EM'),                                   // 38: Comm Number Qualifier 2 (2, A/N) - Email
    field(80, enrollment.student_email),                // 39: Comm Number 2 (80, A/N)
    field(2, null),                                   // 40: Comm Number Qualifier 3 (2, A/N)
    field(80, null),                                  // 41: Comm Number 3 (80, A/N)
    field(2, null),                                   // 42: Comm Number Qualifier 4 (2, A/N)
    field(80, null),                                  // 43: Comm Number 4 (80, A/N)
    field(1, null),                                   // 44: Academic Credit Type Code (1, A/N) A/C/G/N/Q/S/U/V/X
    field(2, null),                                   // 45: Academic Summary Type (2, A/N) A/E
    field(8, null),                                   // 46: Academic Credit Hours Attempted (8, N) 9(6)V99
    field(8, null),                                   // 47: Academic Credit Hours Earned (8, N) 9(6)V99
    field(8, null),                                   // 48: Lowest Possible GPA (8, N) 9(6)V99
    field(8, null),                                   // 49: Highest Possible GPA (8, N) 9(6)V99
    field(1, null),                                   // 50: Excessive GPA Indicator (1, A/N) Y/N
    field(8, null),                                   // 51: School Entry Date (8, A/N) CCYYMMDD
    field(8, null),                                   // 52: School Exit Date (8, A/N) CCYYMMDD
    field(72, null),                                  // 53: Filler
    field(9, null),                                   // 54: Filler Reserved for Local Use
  ].join('');
}

// =============================================================================
// ERR - Error Record (custom format, not part of FASTER spec)
// =============================================================================

/** ERR - Error Record */
export function buildErrorRecord(error: FasterError): string {
  return [
    field(3, 'ERR'),
    field(10, error.studentNumber),
    field(ERROR_CODE_LEN, error.code),
    field(ERROR_MESSAGE_LEN, error.message),
    field(ERROR_TIMESTAMP_LEN, error.timestamp),
  ].join('');
}

// =============================================================================
// Aggregate builder
// =============================================================================

/**
 * Build all FASTER records for a single student enrollment.
 * Returns array of fixed-length lines (1020 bytes each, except ERR).
 */
export function buildAllRecords(enrollment: Enrollment): string[] {
  const lines: string[] = [];

  // S01 - Student Demographic Information
  lines.push(buildS01Record(enrollment));

  // S03 - School Year records (one per term)
  const terms = enrollment.terms as unknown as FasterTermData[];
  if (terms && Array.isArray(terms)) {
    for (const term of terms) {
      lines.push(buildS03Record(enrollment, term));

      // S04 - Course records (one per course within each term)
      const courses = term.courses || [];
      if (Array.isArray(courses)) {
        for (const course of courses) {
          lines.push(buildS04Record(enrollment, term, course));
        }
      }
    }
  }

  // S05 - CTE/ELL/Dropout Information
  lines.push(buildS05Record(enrollment));

  return lines;
}

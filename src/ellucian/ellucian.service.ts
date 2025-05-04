import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { RedisService } from '../services/redis.service';
import { jwtDecode } from 'jwt-decode';
import { StudentIdDto } from '../dtos/studentId.dto';
import { SisLoaderService } from '../sis/loaders/sisLoader.service';
import { CollegeCourseDto, CollegeTermDto, CollegeTranscriptDto, TermDto } from '../dtos/transcript.dto';


const ELLUCIAN_PERSON_API_ROUTE = "/api/persons";
const ELLUCIAN_ADDRESS_ROUTE = "/api/addresses";
const ELLUCIAN_TRANSCRIPT_API_ROUTE = "/api/student-transcript-grades";
const ELLUCIAN_GRADE_POINT_AVERAGE_API_ROUTE = "/api/student-grade-point-averages";
const ELLUCIAN_STUDENT_API_ROUTE = "";
const ELLUCIAN_SECTIONS_API_ROUTE = "";
const ELLUCIAN_COURSES_API_ROUTE = "";
const ELLUCIAN_ACADEMIC_PERIOD_API_ROUTE = "";
const ELLUCIAN_ACADEMIC_GRADE_DEF_API_ROUTE = "";
const ELLUCIAN_AUTH_ROUTE = "/auth";

@Injectable()
export class EllucianService extends SisLoaderService {
  private accessToken: string = '';
  private baseUrl: string;
  private authUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {
    super();
    this.baseUrl = this.configService.get<string>('ELLUCIAN_BASE_API_URL');
  }

  // Ellucian had not specified a load procedure
  async load(): Promise<void> {}


  async getAccessToken(): Promise<void> {
    const tokenKey = 'accessToken';
    const expiryKey = 'tokenExpiry';

    const cachedToken = await this.redisService.get(tokenKey);
    const cachedExpiry = await this.redisService.get(expiryKey);


    if (cachedToken && cachedExpiry && Number(cachedExpiry) > Date.now()) {
      this.accessToken = cachedToken;
      console.log('Using cached access token');
      return;
    }

    const authUrl = `${this.baseUrl}${ELLUCIAN_AUTH_ROUTE}`;
    console.log(`Fetching new access token from: ${authUrl}`);
    let response;
    try {
      response = await firstValueFrom(this.httpService.post(authUrl, {}, {
        headers: { Authorization: `Bearer ${this.configService.get<string>('ELLUCIAN_API_KEY')}` }
      }).pipe(map(res => res.data)));
    }
    catch (error) {
      console.log(`Could not fetch access token: ${error}`);
    }

    const decodedToken = jwtDecode(response) as any;
    const currentTime = Date.now();
    const expiresIn = Math.floor((decodedToken.exp * 1000 - currentTime) / 1000);

    await this.redisService.set(tokenKey, response, expiresIn);
    await this.redisService.set(expiryKey, (currentTime + expiresIn * 1000).toString());

    this.accessToken = response;
  }

  async getPerson(studentNumber: string): Promise<any> {
    if (!studentNumber) {
      throw new Error('Student number is required');
    }
    const criteria = encodeURIComponent(`{"credentials":[{"type":"colleaguePersonId","value":"${studentNumber}"}]}`);
    const url = `${this.baseUrl}${ELLUCIAN_PERSON_API_ROUTE}?criteria=${criteria}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).pipe(
          map(response => response.data)
        )
      );
      if (response) return response[0];
      else throw new Error("Ellucian returned no data");
    } catch (error) {
      console.error('Error fetching student information:', error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch student information');
    }
  }

  private async fetchFromEllucian(url: string): Promise<any> {
    console.log("HttpService call to: ", url);
    try {
      const response = await firstValueFrom(this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }

      }));
      if (!response.data) {
        console.error("HttpService response contained no body");
      }
      return response.data;
    } catch (error) {
      console.error(`Error accessing ${url}:`, error.message);
      throw new Error('Failed to fetch data from Ellucian API');
    }
  }

  async getAddress(ellucianPerson: any): Promise<string | null> {
    const addressId = ellucianPerson.addresses[0]?.address?.id;
    if (!addressId) {
      console.log("No address in Ellucian Person response");
      return null;
    }
  
    const url = `${this.baseUrl}${ELLUCIAN_ADDRESS_ROUTE}/${addressId}`;
    const response = await this.fetchFromEllucian(url);
  
    if (!response?.addressLines) {
      console.error("No address was given from Ellucian");
      return null;
    }
  
    return response.addressLines.join("\n");
  }


  async getStudentTranscriptGrades(studentGuid: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_TRANSCRIPT_API_ROUTE}?criteria={"student":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }


  async getStudent(studentGuid: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_STUDENT_API_ROUTE', '');
    const url = `${this.baseUrl}${apiRoute}?criteria={"person":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }

  async getCourseIdBySection(sectionId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_SECTIONS_API_ROUTE', '');
    const url = `${this.baseUrl}${apiRoute}/${sectionId}`;
    return this.fetchFromEllucian(url);
  }

  async getCourse(courseId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_COURSES_API_ROUTE', '');
    const url = `${this.baseUrl}${apiRoute}/${courseId}`;
    return this.fetchFromEllucian(url);
  }

  async getAcademicPeriod(academicPeriodId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_ACADEMIC_PERIOD_API_ROUTE', '');
    const url = `${this.baseUrl}${apiRoute}/${academicPeriodId}`;
    return this.fetchFromEllucian(url);
  }

  async getGradeDefinition(gradeDefinitionId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_ACADEMIC_GRADE_DEF_API_ROUTE', '');
    const url = `${this.baseUrl}${apiRoute}/${gradeDefinitionId}`;
    return this.fetchFromEllucian(url);
  }

  async getStudentGradePointAverages(studentGuid: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_GRADE_POINT_AVERAGE_API_ROUTE}?criteria={"student":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }

  async getStudentId(studentNumber: string): Promise<StudentIdDto> {
    await this.getAccessToken();
    const person = await this.getPerson(studentNumber);
    if (!person) {
      throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
    }

    let studentId = new StudentIdDto();
    studentId.studentNumber = person.studentsId?.studentsId ?? null;
    studentId.studentFullName = person.names[0]?.fullName ?? null;
    studentId.studentBirthDate = person.dateOfBirth ?? null;
    studentId.studentPhone = person.phones[0]?.number ?? null;
    studentId.studentEmail = person.emails.find(e => e.preference === "primary")?.address ?? null;
    studentId.expiration = this.configService.get("STUDENTID_EXPIRATION");
    return studentId;
  }

  async getStudentTranscript(studentNumber: string): Promise<CollegeTranscriptDto> {
    console.log("Getting student transcript from Ellucian for student: ", studentNumber);

    await this.getAccessToken();

    // Make initial call to ellucian to get a Person
    const ellucianPerson = await this.getPerson(studentNumber);
    if (!ellucianPerson) {
      throw new HttpException("Student not found", HttpStatus.NOT_FOUND);
    }
    if (!ellucianPerson.id) {
      throw new HttpException("Person GUID not found", HttpStatus.NOT_FOUND);
    }

    // const ellucianStudent = await this.getStudent(ellucianPerson.id);

    // Make a list of tasks to execute in parallel
    const tasks = [
      // this.getAddress(ellucianPerson),
      this.getStudentGradePointAverages(ellucianPerson.id),
      this.getStudentTranscriptGrades(ellucianPerson.id),
    ]
    // // Extract data from the tasks after all have resolved
    const [
      // address,
      gradePointAverages,
      transcriptGrades,
    ] = await Promise.all(tasks);

    // Create the transcript DTO and set all of the fields
    let transcript = new CollegeTranscriptDto();
    transcript.transcriptDate = new Date().toLocaleDateString();
    transcript.transcriptComments = "A=4, B=3, C=2, D=1, F=0"
    if (studentNumber !== ellucianPerson.studentsId?.studentsId) {
      console.error("Student number given did not match student number in response");
    }
    transcript.studentNumber = studentNumber;

    transcript.studentFullName = ellucianPerson.names[0]?.fullName ?? null;
    transcript.studentBirthDate = ellucianPerson.dateOfBirth ?? null;
    transcript.studentPhone = ellucianPerson.phones[0]?.number ?? null;
    transcript.studentEmail = ellucianPerson.emails.find(e => e.preference === "primary")?.address ?? null;
    // transcript.studentAddress = "1234 Oak Ln\nWilmington, NC" // address;
    transcript.studentSsn = ellucianPerson.credentials.find(e => e.type === "taxIdentificationNumber")?.value ?? null;
    // transcript.program = "Associate in Arts";
    // transcript.schoolName = "Cape Fear Community College";
    // transcript.schoolPhone = "555-555-5555";
    // transcript.schoolAddress = "411 N. Front Street\nWilmington, NC 28401";

    const cumulativeGpa = gradePointAverages[0]?.cumulative.find(e => e.academicSource === "all");
    if (cumulativeGpa) {
      transcript.gpa = cumulativeGpa.value;
      transcript.earnedCredits = cumulativeGpa.earnedCredits ?? null;
    }

    const termIds = gradePointAverages[0].periodBased
      .filter(e => e.academicSource === "all")
      .map(e => e.academicPeriod.id);

    let terms = {};

    for (const termId of termIds) {
      let term = new CollegeTermDto();

      const termGpa = gradePointAverages[0]?.periodBased
        .find(e => e.academicPeriod.id === termId && e.academicSource === "all");

      // term.termYear = "2024";
      term.termCredit = termGpa?.earnedCredits?.toFixed(2) ?? null;
      term.termGpa = termGpa?.value?.toFixed(4) ?? null;
      // term.termSeason = "Fall";
      // term.academicStanding = "Honor's List";
      term.termHoursPossible = termGpa?.attemptedCredits?.toFixed(2) ?? null;
      term.termHoursEarned = termGpa?.earnedCredits?.toFixed(2) ?? null;
      term.termGradePoints = termGpa?.qualityPoints?.toFixed(2) ?? null;
      // term.cumulativeHoursPossible = "22.00";
      // term.cumulativeHoursEarned = "52.00";
      // term.cumulativeGradePoints = "73.00";
      // term.cumulativeGpa = " 3.192";

      term.courses = [];

      terms[termId] = term;
    }

    const sessionIds = transcriptGrades.map(e => e.course.section.id);

    for (const sessionId of sessionIds) {
      let course = new CollegeCourseDto();

      const transcriptGrade = transcriptGrades.find(e => e.course.section.id === sessionId);
      console.log("Transcript grade: ", transcriptGrade);

      // course.courseCode = "BIO-168";
      // course.courseTitle = "Anatomy and Physiology 1";
      // course.grade = "A";
      course.creditEarned = transcriptGrade?.credit?.earnedCredit?.toFixed(2) ?? null;
      course.gradePoints = transcriptGrade?.credit?.qualityPoint?.gpa.toFixed(2) ?? null;
      // course.transfer = false;
      // course.inProgress = false;
      // course.flags = ["A"];
      course.hoursPossible = transcriptGrade?.credit?.attemptedCredit?.toFixed(2) ?? null;
      course.hoursEarned = transcriptGrade?.credit?.earnedCredit?.toFixed(2) ?? null;
      // course.repeat = true;
      // course.schoolName = "Cape Fear Community College";

      terms[transcriptGrade.academicPeriod.id].courses.push(course);
    }

    transcript.terms = Object.values(terms);

    return transcript;
  }
}
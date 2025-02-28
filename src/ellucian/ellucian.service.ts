import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { RedisService } from '../services/redis.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class EllucianService {
  private accessToken: string = '';
  private apiUrl: string;
  private authUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {
    const baseUrl = this.configService.get<string>('ELLUCIAN_BASE_API_URL');
    const authRoute = this.configService.get<string>('ELLUCIAN_AUTH_ROUTE');
    this.authUrl = `${baseUrl}${authRoute}`;
    this.apiUrl = baseUrl;
  }

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

    console.log('Fetching new access token');
    const response = await firstValueFrom(this.httpService.post(this.authUrl, {}, {
      headers: { Authorization: `Bearer ${this.configService.get<string>('ELLUCIAN_API_KEY')}` }
    }).pipe(map(res => res.data)));

    const decodedToken = jwt.decode(response) as any;
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

    const apiRoute = this.configService.get<string>('ELLUCIAN_PERSON_API_ROUTE', '');
    const criteria = encodeURIComponent(`{"credentials":[{"type":"colleaguePersonId","value":"${studentNumber}"}]}`);
    const url = `${this.apiUrl}${apiRoute}?criteria=${criteria}`;

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
      return response;
    } catch (error) {
      console.error('Error fetching student information:', error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch student information');
    }
  }

  private async fetchFromEllucian(url: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }

      }));
      return response.data;
    } catch (error) {
      console.error(`Error accessing ${url}:`, error.message);
      throw new Error('Failed to fetch data from Ellucian API');
    }
  }


  async getStudentTranscriptGrades(studentGuid: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_TRANSCRIPT_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}?criteria={"student":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }


  async getStudent(studentGuid: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_STUDENT_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}?criteria={"person":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }

  async getCourseIdBySection(sectionId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_SECTIONS_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}/${sectionId}`;
    return this.fetchFromEllucian(url);
  }

  async getCourse(courseId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_COURSES_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}/${courseId}`;
    return this.fetchFromEllucian(url);
  }

  async getAcademicPeriod(academicPeriodId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_ACADEMIC_PERIOD_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}/${academicPeriodId}`;
    return this.fetchFromEllucian(url);
  }

  async getGradeDefinition(gradeDefinitionId: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_ACADEMIC_GRADE_DEF_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}/${gradeDefinitionId}`;
    return this.fetchFromEllucian(url);
  }

  async getStudentGradePointAverages(studentGuid: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_GRADE_POINT_AVERAGE_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}?criteria={"student":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }


  async getStudentIdCred(studentNumber: string) {
    await this.getAccessToken();
    const person = await this.getPerson(studentNumber);
    if (!person || !person.length) {
      throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
    }
    return {
      fullName: person[0].names[0]?.fullName ?? null,
      firstName: person[0].names[0]?.firstName ?? null,
      middleName: person[0].names[0]?.middleName ?? null,
      lastName: person[0].names[0]?.lastName ?? null,
      schoolPrimaryEmail: person[0].emails.find(email => email.type.emailType === "school" && email.preference === "primary")?.address ?? null,
      personalEmail: person[0].emails.find(email => email.type.emailType === "personal")?.address ?? null,
      studentsId: person[0].studentsId.studentsId ?? null,
      studentGUID: person[0].id
    };
  }

}
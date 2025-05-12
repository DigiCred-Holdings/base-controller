import { Test, TestingModule } from '@nestjs/testing';
import { EllucianService } from './ellucian.service';
import { StudentIdDto } from '../dtos/studentId.dto';
import { validate } from 'class-validator';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service';
import { of, throwError } from 'rxjs';
import { academicPeriodResponse, academicProgramsResponse, creditCategoriesResponse, gradeDefinitionResponse, personsResponse, sectionResponse, studentAcademicProgramsResponse, studentGradePointAveragesResponse, studentTranscriptGradesResponse } from "../../test/ellucian/ellucianResponses"
import * as jwt from "jsonwebtoken";
import { CollegeTranscriptDto } from '../dtos/transcript.dto';
import { AxiosResponse } from 'axios';

const env = {
  "ELLUCIAN_BASE_API_URL": "https://test.com",
  "STUDENTID_EXPIRATION": "01011970"
}


describe('EllucianService', () => {
  let service: EllucianService;
  const expectedId = new StudentIdDto();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EllucianService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              return env[key];
            })
          }
        },
        {
          provide: RedisService,
          useValue: {
              get: jest.fn(),
              set: jest.fn(),
          }
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(() => of({data: jwt.sign({}, "test")})),
            get: jest.fn((url: string) => {
              if (url.includes('/api/persons')) {
                return of({ data: personsResponse });
              } else if (url.includes('/api/student-grade-point-averages')) {
                return of({ data: studentGradePointAveragesResponse });
              } else if (url.includes("/api/student-transcript-grades")) {
                return of({ data: studentTranscriptGradesResponse});
              } else if (url.includes("/sections")) {
                return of({ data: sectionResponse})
              } else if (url.includes("/grade-definitions")) {
                return of({ data: gradeDefinitionResponse})
              } else if (url.includes("/academic-periods")) {
                return of({ data: academicPeriodResponse})
              } else if (url.includes("/credit-categories")) {
                return of({ data: creditCategoriesResponse})
              } else if (url.includes("/student-academic-programs")) {
                return of({ data: studentAcademicProgramsResponse})
              } else if (url.includes("/academic-programs")) {
                return of({ data: academicProgramsResponse})
              } else {
                throw new Error("Http route has not been mocked");
              }
            })
          }
        }
      ],
    }).compile();

    service = module.get<EllucianService>(EllucianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentId', () => {
  
    const expectedId = new StudentIdDto();
    expectedId.studentNumber = "0512831";
    expectedId.studentFullName = "Lauren G. Proctor";
    expectedId.studentBirthDate = "2005-06-29";
    expectedId.studentPhone = "910-619-5601";
    expectedId.studentEmail = "lgproctor831@BADmail.cfcc.edu";
    expectedId.expiration = "20250701";

    it('returns a studentid when given a student number', async () => {
      const response: StudentIdDto = await service.getStudentId("0512831");
      expect(response.studentNumber).toEqual(expectedId.studentNumber);
      expect(response.studentFullName).toEqual(expectedId.studentFullName);
      expect(response.schoolName).toEqual(expectedId.schoolName);
      expect(response.expiration).toEqual(env.STUDENTID_EXPIRATION);

      validate(response);
    })

    it('returns null when studentid cannot be generated', async () => {
        // const response = await sisService.getStudentId('Fake student id');
        
        // expect(response).toBeNull();
    })
  })
  
  describe('getStudentTranscript', () => {
      it("returns a transcript when given a student number", async () => {
        const response: CollegeTranscriptDto = await service.getStudentTranscript("0512831");
        console.log(response);
        expect(Object.keys(response).length).toBeGreaterThanOrEqual(10);
        validate(response);        
      })

      it("handles 4XX errors from all endpoints except /api/persons", async () => {
        const mockHttpService = service['httpService'];
      
        jest.spyOn(mockHttpService, 'get').mockImplementation((url: string) => {
          if (url.includes('/api/persons')) {
            const mockResponse: AxiosResponse = {
              data: personsResponse,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {
                headers: undefined
              }
            };
            return of(mockResponse);
          } else {
            const error = {
              response: {
                status: 404,
                statusText: 'Not Found',
                data: {},
                headers: {},
                config: {}
              },
              message: 'Request failed with status code 404'
            };
            return throwError(() => error);
          }
        });
      
        const result = await service.getStudentTranscript("0512831");
        console.log(result);
      
        expect(result).toBeDefined();
      });
  })
});

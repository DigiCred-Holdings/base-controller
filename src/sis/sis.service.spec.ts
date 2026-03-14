import { Test } from "@nestjs/testing";
import { SisService } from "./sis.service";
import { SisLoaderService } from "./loaders/sisLoader.service";
import { ConfigService } from "@nestjs/config";
import { StudentIdDto } from "../dtos/studentId.dto";
import { TestLoaderService } from "./loaders/testLoader.service";
import { validate } from "class-validator";
import { TranscriptDto } from "../dtos/transcript.dto";
import { HttpService } from "@nestjs/axios";
import { RedisService } from "src/services/redis.service";
import { exampleHighSchoolStudent } from "./loaders/testLoaderData/exampleStudents";

const env = {
    'STUDENTID_EXPIRATION': '06/21/21'
}

describe('SisController', () => {

    let sisService: SisService;
    let testLoaderService: TestLoaderService;
    let testStudentValues: any;

    beforeEach(async () => {
        // Mock HttpService and RedisService for TestLoaderService
        const mockHttpService = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
        };
        const mockRedisService = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            del: jest.fn(),
        };

        // Create TestLoaderService with mocked dependencies
        testLoaderService = new TestLoaderService(mockHttpService as any, mockRedisService as any);
        testStudentValues = exampleHighSchoolStudent;

        const module = await Test.createTestingModule({
            providers: [
                SisService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            return env[key];
                        })
                    }
                },
                {
                    provide: SisLoaderService,
                    useValue: {
                        load: jest.fn(testLoaderService.load.bind(testLoaderService)),
                        getStudentId: jest.fn(testLoaderService.getStudentId.bind(testLoaderService)),
                        getStudentTranscript: jest.fn(testLoaderService.getStudentTranscript.bind(testLoaderService))
                    }
                }
            ],
        }).compile()

        sisService = module.get(SisService);
    })

    it('is defined', () => {
        expect(sisService).toBeDefined();
    });

    describe('getStudentId', () => {

        it('returns a studentid when given a student number', async () => {
            const expectedId = new StudentIdDto();
            expectedId.studentNumber = testStudentValues.studentNumber;
            expectedId.studentFullName = testStudentValues.studentFullName;
            expectedId.schoolName = testStudentValues.schoolName;
            expectedId.expiration = env.STUDENTID_EXPIRATION;

            const response: StudentIdDto = await sisService.getStudentId(testStudentValues.studentNumber);

            expect(response.studentNumber).toEqual(expectedId.studentNumber);
            expect(response.studentFullName).toEqual(expectedId.studentFullName);
            expect(response.schoolName).toEqual(expectedId.schoolName);
            expect(response.expiration).toEqual(env.STUDENTID_EXPIRATION);

            validate(response);
        })

        it('returns null when studentid cannot be generated', async () => {
            const response = await sisService.getStudentId('Fake student id');
            
            expect(response).toBeNull();
        })
    })

    describe('getStudentTranscript', () => {

        it('returns a transcript when given a student number', async () => {
            const expectedTranscript = new TranscriptDto();
            expectedTranscript.studentNumber = testStudentValues.studentNumber;

            const response: TranscriptDto = await sisService.getStudentTranscript(testStudentValues.studentNumber);

            expect(response.studentNumber).toEqual(expectedTranscript.studentNumber)
        })

        it('returns null when studentid cannot be generated', async () => {
            const response: TranscriptDto = await sisService.getStudentTranscript("Fake student id");

            expect(response).toBeNull();
        })
    })
})

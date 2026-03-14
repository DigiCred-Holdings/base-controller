import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { RedisService } from "../../services/redis.service";
import { NhcsLoaderService } from "./nhcsLoader.service";
import { CsvLoaderService } from "../data-extract/csvLoader.service";
import { PdfLoaderService } from "../data-extract/pdfLoader.service";

jest.mock('fs');
const fs = require('fs');

const env = {
}

describe('SisController', () => {

    let nhcsLoaderService: NhcsLoaderService;

    beforeEach(async () => {
        // Mock fs.readdirSync to return empty array (no files)
        fs.readdirSync.mockReturnValue([]);

        const module = await Test.createTestingModule({
            providers: [
                NhcsLoaderService,
                {
                    provide: CsvLoaderService,
                    useValue: {
                        load: jest.fn().mockResolvedValue(undefined),
                    }
                },
                {
                    provide: RedisService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                    }
                },
                PdfLoaderService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            return env[key];
                        })
                    }
                },
            ],
        }).compile()

        nhcsLoaderService = module.get(NhcsLoaderService);
    })

    it('is defined', () => {
        expect(nhcsLoaderService).toBeDefined();
    });

    describe('load', () => {
        it('loads pdfs into the redis cache', async () => {
            await nhcsLoaderService.load();
        })
    })

    describe('getStudentId', () => {

        // const expectedDto = new StudentIdDto();
        // expectedDto.studentNumber = testStudentValues.studentNumber;
        // expectedDto.studentFullName = testStudentValues.studentName;
        // expectedDto.schoolName = testStudentValues.schoolName;
        // expectedDto.expiration = env.STUDENTID_EXPIRATION;

        // it('returns a studentid when given a student number', async () => {
        //     const response: StudentIdDto = await sisService.getStudentId(testStudentValues.studentNumber);
            
        //     expect(response.studentNumber).toEqual(expectedDto.studentNumber);
        //     expect(response.studentFullName).toEqual(expectedDto.studentFullName);
        //     expect(response.schoolName).toEqual(expectedDto.schoolName);
        //     expect(response.expiration).toEqual(env.STUDENTID_EXPIRATION);

        //     validate(response);
        // })

        // it('returns null when studentid cannot be generated', async () => {
        //     const response = await sisService.getStudentId('Fake student id');
            
        //     expect(response).toBeNull();
        // })
    })

    describe('getStudentTranscript', () => {

    })
})

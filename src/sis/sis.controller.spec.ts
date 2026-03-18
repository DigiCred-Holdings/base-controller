import { ConfigService } from "@nestjs/config";
import { SisLoaderService } from "./loaders/sisLoader.service";
import { SisController } from "./sis.controller";
import { SisService } from "./sis.service";
import { ModuleMocker } from "jest-mock"
import { Test } from "@nestjs/testing";
import { of } from "rxjs";

const testStudentId = {
    studentName: 'Michael Jordan',
    studentNumber: '0023'
}

describe('SisController', () => {

    let sisController: SisController;
    let sisService: SisService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [SisController],
            providers: [
                {
                    provide: SisService,
                    useValue: {
                        getStudentId: jest.fn().mockResolvedValue({
                            studentNumber: testStudentId.studentNumber,
                            studentFullName: testStudentId.studentName,
                        }),
                    }
                }
            ],
        }).compile()

        sisController = moduleRef.get(SisController);
    })

    it('should be defined', () => {
        expect(sisController).toBeDefined();
    });

    describe('getStudentId', () => {
        it('should return a studentid when given a number', async () => {
            const response = await sisController.getStudentId('0023');
            expect(response).toBeDefined();
            expect(response.studentIdCred).toBeDefined();
            expect(response.studentIdCred.studentNumber).toEqual(testStudentId.studentNumber);
        })
    })


})
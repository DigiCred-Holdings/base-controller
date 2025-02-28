import { Injectable } from '@nestjs/common';
import { UpdateSiDto } from './dto/update-si.dto';
import path from 'path';
import fs from 'fs';

@Injectable()
export class SisService {
  
  // filePath = path.join(process.cwd(), './src/sis/student-transcript.json');
    // result = JSON.parse(fs.readFileSync(this.filePath, 'utf-8').toString());
/*   
    async getStudentTranscript(studentNumber: string) {
        return this.result.transcript;
    }

    async getStudentDetails(studentNumber: string) {
        return this.result.studentId;
    }
    
    async getStudent(id: number) {
      return this.result;
    }
 */
}

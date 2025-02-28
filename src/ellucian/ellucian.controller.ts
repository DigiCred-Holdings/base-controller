import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EllucianService } from './ellucian.service';

@ApiTags('CapeFear SIS')
@Controller()
export class EllucianController {
  constructor(
    private readonly ellucianService: EllucianService,
  ) {}

  @Get('student-transcript')
  @ApiOperation({ summary: 'Retrieve student information by student number' })
  @ApiQuery({ name: 'studentNumber', required: true, type: String, description: 'The student number' })
  @ApiResponse({ status: 200, description: 'The student information' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudentInfo(@Query('studentNumber') studentNumber: string) {
    console.log('************* Ellucian API controller -student-transcript ***************  /n');
    try {
      await this.ellucianService.getAccessToken(); 
      const studentInfo = await this.ellucianService.getPerson(studentNumber);
      if (!studentInfo.length) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }
      const studentGuid = studentInfo[0].id;
      const [transcriptGrades, gradePointAverages] = await Promise.all([
        this.ellucianService.getStudentTranscriptGrades(studentGuid),
        this.ellucianService.getStudentGradePointAverages(studentGuid)
      ]);

      const courseTranscript = await Promise.all(transcriptGrades.map(async (grade) => {
        return this.getTranscriptDetails(grade);
      }));

      const studentCumulativeTranscript = [{
                cumulativeAttemptedCredits: gradePointAverages[0].cumulative[0]?.attemptedCredits ?? null,
                cumulativeEarnedCredits: gradePointAverages[0].cumulative[0]?.earnedCredits ?? null,
                cumulativeGradePointAverage: gradePointAverages[0].cumulative[0]?.value ?? null,
              }] 

      const studentId = [{
                firstName: studentInfo[0].names[0]?.firstName ?? null,
                middleName: studentInfo[0].names[0]?.middleName ?? null,
                lastName: studentInfo[0].names[0]?.lastName ?? null,
                studentID: studentInfo[0].studentsId.studentsId ?? null,
              }] 

      return {
        studentId,
        studentCumulativeTranscript,
        courseTranscript
        // gradePointAverages
      };
    } catch (error) {
      throw new HttpException('Failed to retrieve student information', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getTranscriptDetails(grade: any) {
    const sectionId = grade.course.section.id;
    const courseId = await this.ellucianService.getCourseIdBySection(sectionId).then (res=>res.course?.id)
    const course = await this.ellucianService.getCourse(courseId);
    const academicPeriod = await this.ellucianService.getAcademicPeriod(grade.academicPeriod.id);
    const gradeInfo = await this.ellucianService.getGradeDefinition(grade.grade.id);

    return {
      schoolYear: academicPeriod.category?.parent?.academicYear ?? null,
      term: academicPeriod.title ?? null,
      courseTitle: course.titles[0]?.value ?? null,
      courseCode: course.crsLocalGovtCodes[0]?.crsLocalGovtCodes ?? null,
      academicPeriod: grade.credit?.attemptedCredit ?? null,
      earnedCredits: grade.credit?.earnedCredit ?? null,
      finalNumericGradeEarned: grade.credit?.qualityPoint?.gpa ?? null,    
      finalLetterGradeEarned: gradeInfo.grade?.value ?? null         
    };
  }


  @Get('student-id')
  @ApiOperation({ summary: 'Retrieve student name and GUID by student number' })
  @ApiQuery({ name: 'studentNumber', required: true, type: String, description: 'The student number' })
  @ApiResponse({ status: 200, description: 'The student name and GUID' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudentName(@Query('studentNumber') studentNumber: string) {
    console.log('************* Ellucian API controller -student-ID ***************  /n');
    try {
      const studentIdCred = await this.ellucianService.getStudentIdCred(studentNumber);
      return { studentIdCred };
    } catch (error) {
      throw new HttpException('Failed to retrieve student information', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

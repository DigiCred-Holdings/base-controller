import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Query } from '@nestjs/common';
import { SisService } from './sis.service';
import { CreateSiDto } from './dto/create-si.dto';
import { UpdateSiDto } from './dto/update-si.dto';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('sis')
export class SisController {
  constructor(private readonly sisService: SisService) {}
/* 
  @Get('student-transcript')
  @ApiOperation({ summary: 'Retrieve student transcript by student number' })
  @ApiQuery({ name: 'studentNumber', required: true, type: String, description: 'The student number' })
  @ApiResponse({ status: 200, description: 'The student transcript' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudentTranscript(@Query('studentNumber') studentNumber: string) {
      let transcript={}
      try {
          transcript=this.sisService.getStudentTranscript(studentNumber);
      } catch (error) {
          throw new HttpException('Failed to retrieve student information', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return transcript;
  }

  @Get('student-id')
  @ApiOperation({ summary: 'Retrieve student name by student number' })
  @ApiQuery({ name: 'studentNumber', required: true, type: String, description: 'The student number' })
  @ApiResponse({ status: 200, description: 'The student name' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudentDetails(@Query('studentNumber') studentNumber: string) {
      let studentIdCred={}
      try {
          studentIdCred=this.sisService.getStudentDetails(studentNumber);
      } catch (error) {
          throw new HttpException('Failed to retrieve student information', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return studentIdCred;
  } */

}

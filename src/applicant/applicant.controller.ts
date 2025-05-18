import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApplicantService } from './applicant.service';
import { Applicant } from './entities/applicant.entity';
import { CreateApplicationDto } from './dto/applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
@Controller('applicant')
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  @Get('/')
  async getAllPostings(): Promise<Applicant[]> {
    return await this.applicantService.getAllPosting();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.applicantService.findOne(id); // id is now type number
  }

  @Post('/create')
  // eslint-disable-next-line prettier/prettier
    async createPosting(@Body() jobposting: CreateApplicationDto ): Promise<Applicant> {
    return await this.applicantService.createPosting(jobposting);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateApplicantDto,
  ): Promise<Applicant> {
    console.log('Update controller hit with ID:', id); // ✅ Add this
    return await this.applicantService.update(id, updateUserDto);
  }
}

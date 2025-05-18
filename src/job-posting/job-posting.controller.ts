import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JobPostingService } from './job-posting.service';
import { JobPosting } from './entities/jobposting.entity';
import { CeateJobPostingDto } from './dto/jobposting.dto';
import { UpdateUserDto } from './dto/update-jobposting.dto';

@Controller('job-posting')
export class JobPostingController {
  constructor(private readonly jobPostingService: JobPostingService) {}
  @Get('/hello')
  getHello(): string {
    return this.jobPostingService.getHello();
  }

  @Get('/')
  async getAllPostings(): Promise<JobPosting[]> {
    console.log('📥 Controller hit');
    return await this.jobPostingService.getAllPosting();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.jobPostingService.findOne(id); // id is now type number
  }

  @Post('/create')
  // eslint-disable-next-line prettier/prettier
  async createPosting(@Body() jobposting: CeateJobPostingDto ): Promise<JobPosting> {
    return await this.jobPostingService.createPosting(jobposting);
  }
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<JobPosting> {
    console.log('Update controller hit with ID:', id); // ✅ Add this
    return await this.jobPostingService.update(id, updateUserDto);
  }
}

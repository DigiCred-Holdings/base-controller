import { Module } from '@nestjs/common';
import { JobPostingService } from './job-posting.service';
import { JobPostingController } from './job-posting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './entities/jobposting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting])],
  providers: [JobPostingService],
  controllers: [JobPostingController],
})
export class JobPostingModule {}

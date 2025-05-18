import { Injectable, NotFoundException } from '@nestjs/common';
import { JobPosting } from './entities/jobposting.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CeateJobPostingDto } from './dto/jobposting.dto';
import { UpdateUserDto } from './dto/update-jobposting.dto';
import { uuid } from 'uuidv4';

@Injectable()
export class JobPostingService {
  constructor(
    @InjectRepository(JobPosting)
    private jobPostingRepository: Repository<JobPosting>,
  ) {}

  getHello(): string {
    return 'Hello World! From job posting';
  }

  async getAllPosting(): Promise<JobPosting[]> {
    const results = await this.jobPostingRepository.find();
    return results;
  }

  //async findone(id: number): Promise<JobPosting | null> {
  // return await this.jobPostingRepository.findOneBy({ id });
  // }

  async findOne(id: string): Promise<JobPosting> {
    const job = await this.jobPostingRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async createPosting(posting: CeateJobPostingDto): Promise<JobPosting> {
    const job = new JobPosting();
    job.id = uuid();
    job.Date = posting.Date;
    job.Title = posting.Title;
    job.Website = posting.Website;
    job.Description = posting.Description;
    console.log('record to create', job);
    const createdPosting = await this.jobPostingRepository.save(job);
    console.log('output from create ', createdPosting);
    return createdPosting;
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<JobPosting> {
    const user = await this.jobPostingRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.jobPostingRepository.save(user);
  }
}

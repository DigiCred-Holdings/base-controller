/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Applicant } from './entities/applicant.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApplicationDto } from './dto/applicant.dto';
import { uuid } from 'uuidv4';
import { UpdateApplicantDto } from './dto/update-applicant.dto';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant)
    private applicantRepository: Repository<Applicant>,
  ) {}

  async getAllPosting(): Promise<Applicant[]> {
    const results = await this.applicantRepository.find();
    console.log(results);
    return results;
  }

  async findOne(id: string): Promise<Applicant> {
    const job = await this.applicantRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async createPosting(applicant: CreateApplicationDto): Promise<Applicant> {
    const app = new Applicant();
    app.id = uuid();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    app.Name = applicant.Name;
    app.Date = applicant.Date;
    app.Courses = applicant.Courses;
    app.Gpa = applicant.Gpa;
    app.Transcript = applicant.Transcript;
    app.Status = applicant.Status;
    console.log('record to create', app);
    const createdPosting = await this.applicantRepository.save(app);
    console.log('output from create ', createdPosting);
    return createdPosting;
  }

  async update(id: string, updateDto: UpdateApplicantDto): Promise<Applicant> {
    const user = await this.applicantRepository.preload({
      id: id,
      ...updateDto,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.applicantRepository.save(user);
  }
}

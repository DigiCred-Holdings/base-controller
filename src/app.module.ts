import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobPostingModule } from './job-posting/job-posting.module';
import { ApplicantModule } from './applicant/applicant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JobPosting } from './job-posting/entities/jobposting.entity';
import { Applicant } from './applicant/entities/applicant.entity';

@Module({
  // eslint-disable-next-line prettier/prettier
  imports: [JobPostingModule, ApplicantModule, TypeOrmModule.forRoot({
      type: 'postgres',
      host: '192.168.2.28',
      port: 5432,
      username: 'admin',
      password: 'root',
      database: 'postgres',
      entities: [JobPosting, Applicant],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}

import { Entity, Column, PrimaryColumn } from 'typeorm';
@Entity()
export class Applicant {
  @PrimaryColumn()
  id: string;

  @Column()
  Name: string;

  @Column()
  Date: string;

  @Column()
  Courses: string;

  @Column()
  Gpa: string;

  @Column()
  Transcript: string;

  @Column()
  Status: string;
}

import { Entity, Column, PrimaryColumn } from 'typeorm';
@Entity()
export class JobPosting {
  @PrimaryColumn()
  id: string;

  @Column()
  Title: string;

  @Column()
  Date: string;

  @Column()
  Website: string;

  @Column()
  Description: string;
}

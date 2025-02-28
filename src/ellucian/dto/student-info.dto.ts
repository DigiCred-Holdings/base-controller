import { IsNotEmpty, IsString, Length } from 'class-validator';

export class StudentInfoDto {
  @IsNotEmpty({
    message: 'Student number is required and cannot be empty.'
  })
  @IsString({
    message: 'Student number must be a string.'
  })
  @Length(1, 20, {
    message: 'Student number must be between 1 and 20 characters long.'
  })
  studentNumber: string;
}

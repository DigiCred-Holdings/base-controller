import { ApiProperty } from '@nestjs/swagger';
export class CreateApplicationDto {
  @ApiProperty({ example: 'Enron', description: 'Conpany Name' })
  Name: string;
  @ApiProperty({ example: 'March 15, 2025', description: 'Job Date' })
  Date: string;
  @ApiProperty({
    example: 'Algebra 221',
    description: 'Courses they are currently enrolled',
  })
  Courses: string;
  @ApiProperty({ example: '3.5', description: 'Total GPA' })
  Gpa: string;
  // eslint-disable-next-line prettier/prettier
  @ApiProperty({example: 'Verified', description: 'Whether the transcript is verified or not',})
  Transcript: string;
  // eslint-disable-next-line prettier/prettier
  @ApiProperty({ example: 'Processed', description: 'Whether its processed or not' })
  Status: string;
}

import { ApiProperty } from '@nestjs/swagger';
export class CeateJobPostingDto {
  @ApiProperty({ example: 'Enron', description: 'Conpany Name' })
  Title: string;
  @ApiProperty({ example: 'March 15, 2025', description: 'Job Date' })
  Date: string;
  @ApiProperty({ example: 'wwww.website.io', description: 'website posting' })
  Website: string;
  @ApiProperty({ example: 'bla bla bla', description: 'Job Description' })
  Description: string;
}

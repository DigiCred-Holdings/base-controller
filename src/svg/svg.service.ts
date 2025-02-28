import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';

// Set up logger
Handlebars.logger.level = 0; // 0 corresponds to 'debug' level
Handlebars.logger.log = function (level, message) {
  console.log(`[${level}] ${message}`);
};

// Register the concat helper
Handlebars.registerHelper('concat', function (...args) {
  return args.slice(0, -1).join('');
});

// Register a custom helper to check equality
Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

@Injectable()
export class SvgService {
  private apiUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get<string>('API_BASE_URL');
  }

  private async getSchemaData(): Promise<any> {
    // Use this credential_exchange_id for Demo Purpose: f40af16d-edc4-4648-80c9-8e97e73a9015
    const url = `${this.apiUrl}:8032/issue-credential/records/f40af16d-edc4-4648-80c9-8e97e73a9015`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          accept: 'application/json',
          'X-API-KEY': this.configService.get<string>('API_KEY'),
          Authorization: `Bearer ${this.configService.get<string>(
            'BEARER_TOKEN',
          )}`,
        },
      }),
    );
    console.log(response.data);

    return response.data;
  }

  //helper function to format the date
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }

  async generateTranscript(): Promise<string> {
    const data = await this.getSchemaData();
    const attributes =
      data.credential_proposal_dict.credential_proposal.attributes;

    // Extract the value of the "Transcript" key
    const transcriptAttribute = attributes.find(
      (attr: { name: string; value: string }) => attr.name === 'Transcript',
    );
    const transcriptValue = transcriptAttribute
      ? transcriptAttribute.value
      : null;

    // Log the extracted Transcript value
    console.log('Transcript Value:', transcriptValue);

    // Parse the transcript value
    const transcriptData = transcriptValue ? JSON.parse(transcriptValue) : [];

    // Group courses by term
    const groupedByTerm = transcriptData.reduce((acc: any, course: any) => {
      const { term, ...courseDetails } = course;
      if (!acc[term]) {
        acc[term] = { term, courses: [] };
      }
      acc[term].courses.push(courseDetails);
      return acc;
    }, {});

    // Convert the grouped object into an array
    const groupedCourses = Object.values(groupedByTerm);

    // Sort grouped courses by term (assuming term contains a date or sortable string)
    //work on sorting more the format is bit difficult to sort i.e. "Fall 2021"
    const sortedGroupedCourses = Object.values(groupedCourses).sort(
      (a: any, b: any) => {
        const dateA = new Date(a.term).getTime();
        const dateB = new Date(b.term).getTime();
        return dateB - dateA; // Sort descending (most recent first)
      },
    );
    // Register Handlebars helpers for y-position calculations
    Handlebars.registerHelper(
      'calcYPosition',
      (index: number) => 236 + index * 200,
    ); // Increase spacing between terms
    Handlebars.registerHelper(
      'calcYPositionText',
      (index: number) => 249.879 + index * 200,
    ); // Increase spacing between terms
    Handlebars.registerHelper(
      'calcCourseYPosition',
      (termIndex: number, courseIndex: number) =>
        270 + termIndex * 200 + courseIndex * 20,
    ); // Adjust spacing between courses and terms
    console.log(
      'Grouped Courses:',
      JSON.stringify(sortedGroupedCourses, null, 2),
    );

    const templatePath = path.resolve(
      __dirname,
      '../../assets/Transcript-Full.svg',
    );
    const svgTemplate = await readFile(templatePath, 'utf8');

    // Create a Handlebars template
    const template = Handlebars.compile(svgTemplate);

    // Map attribute values
    const attributeMap: { [key: string]: string } = {};
    attributes.forEach((attr: { name: string; value: string }) => {
      attributeMap[attr.name] = attr.value;
    });

    // Prepare data for Handlebars template
    const templateData = {
      ...attributeMap,
      issued: this.formatDate(data.created_at),
      groupedCourses: sortedGroupedCourses,
    };

    // Render the SVG with the data
    const svg = template(templateData);

    return svg;
  }
}

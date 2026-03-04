import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { FasterError } from '../interfaces/faster-request.interface';
import { buildAllRecords, buildErrorRecord } from '../templates/record-templates';

@Injectable()
export class FasterExportService {
  private readonly logger = new Logger(FasterExportService.name);
  private readonly outputDir: string;

  constructor(private readonly configService: ConfigService) {
    this.outputDir = this.configService.get<string>('FASTER_OUTPUT_DIR', './faster-sftp');
  }

  /**
   * Export transcript records for one or more enrollments (batch export).
   * All student records are concatenated into a single output file.
   *
   * @param enrollments - Array of enrollments to export (batch of N or batch of 1)
   * @param sourceFilename - Original request filename for traceability
   * @returns Path to the written output file
   */
  exportBatch(enrollments: Enrollment[], sourceFilename: string): string {
    this.ensureOutputDir();

    const allLines: string[] = [];
    for (const enrollment of enrollments) {
      const studentLines = buildAllRecords(enrollment);
      allLines.push(...studentLines);
    }

    const content = allLines.join('\n') + '\n';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = path.basename(sourceFilename, path.extname(sourceFilename));
    const outFilename = `FASTER_${baseName}_${timestamp}.txt`;
    const outPath = path.join(this.outputDir, outFilename);

    try {
      fs.writeFileSync(outPath, content, 'utf-8');
      this.logger.log(`Exported FASTER batch (${enrollments.length} students) to: ${outPath}`);
      return outPath;
    } catch (err) {
      this.logger.error(`Failed to write export file: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Write an error file containing all errors from a batch processing run.
   *
   * @param errors - Array of errors to write
   * @param sourceFilename - Original request filename for traceability
   * @returns Path to the written error file, or null if no errors
   */
  writeErrorFile(errors: FasterError[], sourceFilename: string): string | null {
    if (errors.length === 0) return null;

    this.ensureOutputDir();

    const lines = errors.map(error => buildErrorRecord(error));
    const content = lines.join('\n') + '\n';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = path.basename(sourceFilename, path.extname(sourceFilename));
    const outFilename = `FASTER_ERR_${baseName}_${timestamp}.txt`;
    const outPath = path.join(this.outputDir, outFilename);

    try {
      fs.writeFileSync(outPath, content, 'utf-8');
      this.logger.log(`Wrote FASTER error file (${errors.length} errors) to: ${outPath}`);
      return outPath;
    } catch (err) {
      this.logger.error(`Failed to write error file: ${(err as Error).message}`);
      throw err;
    }
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
}

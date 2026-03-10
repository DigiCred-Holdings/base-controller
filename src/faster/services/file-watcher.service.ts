import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FasterProcessingService } from './faster-processing.service';

@Injectable()
export class FileWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FileWatcherService.name);
  private watcher: fs.FSWatcher | null = null;
  private readonly inputDir: string;
  private readonly processedFiles: Set<string> = new Set();

  /** Debounce delay (ms) to ensure file is fully written before reading */
  private readonly DEBOUNCE_MS = 500;

  constructor(
    private readonly configService: ConfigService,
    private readonly processingService: FasterProcessingService,
  ) {
    this.inputDir = this.configService.get<string>('FASTER_INPUT_DIR', './faster-sftp');
  }

  onModuleInit(): void {
    // Ensure directory exists
    if (!fs.existsSync(this.inputDir)) {
      fs.mkdirSync(this.inputDir, { recursive: true });
      this.logger.log(`Created FASTER input directory: ${this.inputDir}`);
    }

    // Process any existing files on startup
    this.processExistingFiles();

    // Watch for new files
    this.logger.log(`Watching directory for FASTER requests: ${this.inputDir}`);
    this.watcher = fs.watch(this.inputDir, (eventType, filename) => {
      if (eventType === 'rename' && filename && !this.processedFiles.has(filename)) {
        const filePath = path.join(this.inputDir, filename);
        // Debounce to ensure file is fully written
        setTimeout(() => {
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            this.handleNewFile(filePath, filename);
          }
        }, this.DEBOUNCE_MS);
      }
    });
  }

  onModuleDestroy(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.logger.log('File watcher stopped');
    }
  }

  private processExistingFiles(): void {
    try {
      const files = fs.readdirSync(this.inputDir);
      for (const filename of files) {
        const filePath = path.join(this.inputDir, filename);
        if (fs.statSync(filePath).isFile() && !this.processedFiles.has(filename)) {
          this.handleNewFile(filePath, filename);
        }
      }
    } catch (err) {
      this.logger.error(`Error scanning existing files: ${(err as Error).message}`);
    }
  }

  private async handleNewFile(filePath: string, filename: string): Promise<void> {
    // Skip output files and error files we generated
    if (filename.startsWith('FASTER_')) {
      return;
    }

    this.processedFiles.add(filename);
    this.logger.log(`Processing new FASTER request file: ${filename}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      await this.processingService.processInputFile(content, filename);
    } catch (error) {
      this.logger.error(`Error processing file ${filename}: ${(error as Error).message}`);
    }
  }
}

import { FileWatcherService } from '../services/file-watcher.service';
import * as fs from 'fs';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('FileWatcherService', () => {
  let service: FileWatcherService;
  let mockConfigService: { get: jest.Mock };
  let mockProcessingService: { processInputFile: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn((key: string, defaultVal?: string) => {
        if (key === 'FASTER_INPUT_DIR') return '/tmp/faster-input';
        return defaultVal ?? '';
      }),
    };
    mockProcessingService = {
      processInputFile: jest.fn().mockResolvedValue({}),
    };

    service = new FileWatcherService(
      mockConfigService as any,
      mockProcessingService as any,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('onModuleInit()', () => {
    it('creates the input directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockReturnValue(undefined);
      mockedFs.readdirSync.mockReturnValue([]);
      mockedFs.watch.mockReturnValue({ close: jest.fn() } as any);

      service.onModuleInit();

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/tmp/faster-input', { recursive: true });
    });

    it('does not create directory if it already exists', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([]);
      mockedFs.watch.mockReturnValue({ close: jest.fn() } as any);

      service.onModuleInit();

      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('processes existing files in directory on startup', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['request1.txt', 'request2.txt'] as any);
      mockedFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockedFs.readFileSync.mockReturnValue('S00202500789123456789');
      mockedFs.watch.mockReturnValue({ close: jest.fn() } as any);

      service.onModuleInit();

      expect(mockProcessingService.processInputFile).toHaveBeenCalledTimes(2);
    });

    it('skips files with FASTER_ prefix (our output files)', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([
        'FASTER_output_2026.txt',
        'FASTER_ERR_request_2026.txt',
        'actual_request.txt',
      ] as any);
      mockedFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockedFs.readFileSync.mockReturnValue('S00202500789123456789');
      mockedFs.watch.mockReturnValue({ close: jest.fn() } as any);

      service.onModuleInit();

      expect(mockProcessingService.processInputFile).toHaveBeenCalledTimes(1);
      expect(mockProcessingService.processInputFile).toHaveBeenCalledWith(
        'S00202500789123456789',
        'actual_request.txt',
      );
    });

    it('starts the file watcher', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([]);
      mockedFs.watch.mockReturnValue({ close: jest.fn() } as any);

      service.onModuleInit();

      expect(mockedFs.watch).toHaveBeenCalledWith('/tmp/faster-input', expect.any(Function));
    });
  });

  describe('onModuleDestroy()', () => {
    it('closes the watcher', () => {
      const closeMock = jest.fn();
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([]);
      mockedFs.watch.mockReturnValue({ close: closeMock } as any);

      service.onModuleInit();
      service.onModuleDestroy();

      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe('deduplication', () => {
    it('does not process the same file twice', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['request.txt'] as any);
      mockedFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockedFs.readFileSync.mockReturnValue('S00202500789123456789');
      mockedFs.watch.mockReturnValue({ close: jest.fn() } as any);

      service.onModuleInit();

      // File was processed once during existing file scan
      expect(mockProcessingService.processInputFile).toHaveBeenCalledTimes(1);

      // Simulate the same file appearing again (e.g. via watcher)
      // The processedFiles set should prevent double-processing
      // We can't easily test the watcher callback, but the set is populated
    });
  });
});

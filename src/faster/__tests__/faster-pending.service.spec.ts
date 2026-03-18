import { FasterPendingService } from '../services/faster-pending.service';
import { PendingFasterRequest } from '../interfaces/faster-request.interface';

describe('FasterPendingService', () => {
  let service: FasterPendingService;
  let mockRedisService: { get: jest.Mock; set: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    service = new FasterPendingService(mockRedisService as any);
  });

  describe('addPendingRequest()', () => {
    it('calls Redis set with correct key, serialized data, and TTL', async () => {
      const request: PendingFasterRequest = {
        studentNumber: '202500789',
        connectionId: 'conn-123',
        sourceFilename: 'test.txt',
        requestedAt: '2026-03-02T12:00:00Z',
      };

      await service.addPendingRequest('202500789', request);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'faster:pending:202500789',
        JSON.stringify(request),
        86400,
      );
    });
  });

  describe('getPendingRequest()', () => {
    it('returns parsed data when key exists', async () => {
      const storedData: PendingFasterRequest = {
        studentNumber: '202500789',
        connectionId: 'conn-123',
        sourceFilename: 'test.txt',
        requestedAt: '2026-03-02T12:00:00Z',
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(storedData));

      const result = await service.getPendingRequest('202500789');

      expect(mockRedisService.get).toHaveBeenCalledWith('faster:pending:202500789');
      expect(result).toEqual(storedData);
    });

    it('returns null when key does not exist', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getPendingRequest('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when stored data is not valid JSON', async () => {
      mockRedisService.get.mockResolvedValue('not-json');

      const result = await service.getPendingRequest('202500789');

      expect(result).toBeNull();
    });
  });

  describe('removePendingRequest()', () => {
    it('calls Redis delete with correct key', async () => {
      await service.removePendingRequest('202500789');

      expect(mockRedisService.delete).toHaveBeenCalledWith('faster:pending:202500789');
    });
  });
});

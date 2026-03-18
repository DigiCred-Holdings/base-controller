import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/services/redis.service';
import { PendingFasterRequest } from '../interfaces/faster-request.interface';

@Injectable()
export class FasterPendingService {
  private readonly logger = new Logger(FasterPendingService.name);
  private readonly KEY_PREFIX = 'faster:pending:';
  private readonly TTL = 86400; // 24 hours

  constructor(private readonly redisService: RedisService) {}

  async addPendingRequest(studentNumber: string, request: PendingFasterRequest): Promise<void> {
    const key = `${this.KEY_PREFIX}${studentNumber}`;
    await this.redisService.set(key, JSON.stringify(request), this.TTL);
    this.logger.log(`Stored pending FASTER request for student ${studentNumber}`);
  }

  async getPendingRequest(studentNumber: string): Promise<PendingFasterRequest | null> {
    const key = `${this.KEY_PREFIX}${studentNumber}`;
    const data = await this.redisService.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as PendingFasterRequest;
    } catch {
      this.logger.warn(`Failed to parse pending request data for key ${key}`);
      return null;
    }
  }

  async removePendingRequest(studentNumber: string): Promise<void> {
    const key = `${this.KEY_PREFIX}${studentNumber}`;
    await this.redisService.delete(key);
    this.logger.log(`Cleared pending FASTER request for student ${studentNumber}`);
  }
}

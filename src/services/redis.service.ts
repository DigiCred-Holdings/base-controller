import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';  // Corrected import statement

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
    });
  }

  // Handle Redis connection events
  onModuleInit() {
    this.client.on('connect', () => console.log('Connected to Redis'));
    this.client.on('error', (error) => console.error('Redis error', error));
  }

  // Ensure Redis client is disconnected when the module is destroyed
  onModuleDestroy() {
    this.client.disconnect();
  }

  // Fetch a value from Redis by key
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  // Set a value in Redis with an optional expiration time
  async set(key: string, value: string, ttl?: number): Promise<string> {
    return ttl ? this.client.set(key, value, 'EX', ttl) : this.client.set(key, value);
  }
}
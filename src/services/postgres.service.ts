import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    console.log('PostgresService constructor');
    this.pool = new Pool({
      host: this.configService.get<string>('WORKFLOW_DB_HOST', 'localhost'),
      port: this.configService.get<number>('WORKFLOW_DB_PORT', 5435),
      user: this.configService.get<string>('WORKFLOW_DB_USER', 'postgres'),
      password: this.configService.get<string>('WORKFLOW_DB_PASSWORD', 'password123'),
      database: this.configService.get<string>('WORKFLOW_DB_NAME', 'postgres'),
    });
  }

  async onModuleInit() {
    try {
      await this.pool.connect();
      console.log('Connected to PostgreSQL');
    } catch (error) {
      console.error('Failed to connect to PostgreSQL', error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  async getClient() {
    return this.pool.connect();
  }
}

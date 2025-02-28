import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class PingService {
    constructor(private readonly httpService:HttpService, private readonly configService:ConfigService){}

    async getConnections(): Promise<any> {

        console.log('Ping controller');

        const messageUrl = `${this.configService.get<string>('API_BASE_URL')}/connections?limit=100&offset=0`;
        console.log('messageUrl:', messageUrl);
        const requestConfig: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
                'X-API-KEY': `${this.configService.get<string>('API_KEY')}`,
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
        };

        try {
            const response = await lastValueFrom(
                this.httpService.get(messageUrl, requestConfig).pipe(map((resp) => resp.data))
            );
            return response;
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    }
}

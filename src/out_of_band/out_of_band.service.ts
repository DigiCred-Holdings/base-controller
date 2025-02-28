import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';


// TODO Still WIP
@Injectable()
export class OutOfBandService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async performOutOfBandTask(outOfBandData: any): Promise<boolean> {
    const connection = outOfBandData.connection_id;
    console.log("connection",connection)

    const send_message =
    `${this.configService.get<string>('API_BASE_URL')}:8032/connections/` +
    connection +
    '/send-message';
  const requestConfig: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
      'X-API-KEY': this.configService.get<string>('API_KEY'),
    },
  };

  console.log('Call REST ', send_message, ' Options ', requestConfig);
  const message = await lastValueFrom(
    this.httpService
      .post(
        send_message,
        {
          content: this.configService.get<string>(
            'SCHOOL_WELCOME_MESSAGE',
          ),
        },
        requestConfig,
      )
      .pipe(map((resp) => resp.data)),
  );
  console.log('REST call returns ', message);
  return true;
}

} 







//     const taskEndpoint = `${this.configService.get<string>('API_BASE_URL')}:8032/out-of-band/`;
//     const requestConfig: AxiosRequestConfig = {
//       headers: {
//         Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
//         'X-API-KEY': this.configService.get<string>('API_KEY'),
//       },
//     };

//     console.log('Calling REST API at', taskEndpoint, 'with options', requestConfig);

//     const response = await lastValueFrom(
//       this.httpService
//         .post(taskEndpoint, { content: outOfBandData.messageContent }, requestConfig)
//         .pipe(map((resp) => resp.data))
//     );

//     console.log('REST call returns', response);
//     return true;
//   }
// }

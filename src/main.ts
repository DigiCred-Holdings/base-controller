import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // //Dynamically allow cors, you can add the url here?
  // app.enableCors({
  //   origin: (origin, callback) => {
  //     const allowedOrigins = [
  //                             configService.get<string>('CORS_ALLOWED_URL_1') || 'http://localhost:5173',
  //                             configService.get<string>('CORS_ALLOWED_URL_1') || 'https://example.com'
  //                           ];
  //     if (!origin || allowedOrigins.includes(origin)) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error('Not allowed by CORS'), false);
  //     }
  //   },
  //   credentials: true, // Optional: if your frontend needs to send cookies or authentication information
  // });

  // Allow CORS for all origins
  app.enableCors({
    origin: true, // This will allow all origins
    // credentials: true, // Optional: if your frontend needs to send cookies or authentication information
  });

  const config = new DocumentBuilder()
    .setTitle('Cape Fear API Client')
    .setDescription('The Cape Fear API client description')
    .setVersion('1.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3008;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

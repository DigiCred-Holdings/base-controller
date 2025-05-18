import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Job Postings')
    .setDescription('The Job Posting API description')
    .setVersion('1.0')
    .addTag('JobPosting')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.enableCors({
    origin: 'http://localhost:3001', // Next.js frontend
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

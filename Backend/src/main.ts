import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (isProduction && !frontendUrl) {
    throw new Error('FRONTEND_URL environment variable is required in production');
  }
  const allowedOrigins = (frontendUrl ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const port = Number(configService.get<string>('PORT') ?? 3000);
  
  // Enable CORS with specific configuration
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  // Enable validation with transformation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true, 
    forbidNonWhitelisted: true, 
  }));
  
  const swaggerEnabled =
    !isProduction || configService.get<string>('ENABLE_SWAGGER') === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Film Website API')
      .setDescription('The film website API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
  
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap(); 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './openapi/openapi-spec';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  // Add global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Enable CORS
  app.enableCors();
  
  // Setup OpenAPI documentation
  setupSwagger(app);
  
  const logger = new Logger('Bootstrap');
  await app.listen(3000);
  logger.log('Application is running on: http://localhost:3000');
  logger.log('OpenAPI documentation available at: http://localhost:3000/api');
}
bootstrap();

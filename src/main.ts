import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from 'src/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
bootstrap();

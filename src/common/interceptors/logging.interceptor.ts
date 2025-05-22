import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, query, body } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${url} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(body)} | +${
            Date.now() - now
          }ms`,
        );
      }),
    );
  }
}

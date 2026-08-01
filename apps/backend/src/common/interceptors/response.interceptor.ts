import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Format de réponse standard imposé par 06_API_SPECIFICATION.md §4.
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true, message: data?.message ?? 'OK', data: data ?? null, meta: data?.meta ?? null, errors: null,
      })),
    );
  }
}

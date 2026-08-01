import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : 'Erreur interne du serveur.';
    const message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message ?? 'Une erreur est survenue.';

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? 'Validation échouée.' : message,
      data: null, meta: null,
      errors: Array.isArray(message) ? message.map((m: string) => ({ field: null, message: m })) : null,
      traceId: randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }
}

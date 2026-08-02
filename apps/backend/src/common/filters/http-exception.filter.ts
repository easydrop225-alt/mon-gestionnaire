import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message ?? 'Une erreur est survenue.';
    } else if (exception instanceof Error) {
      // PHASE DE MISE EN PLACE : on renvoie le message d'erreur technique réel
      // (habituellement caché en production) pour permettre de diagnostiquer
      // sans avoir à consulter les logs Vercel. À retirer une fois l'app stable
      // en production (repasser à un message générique fixe).
      this.logger.error(exception.message, exception.stack);
      message = `Erreur technique : ${exception.message}`;
    } else {
      message = 'Erreur interne du serveur.';
    }

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

import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorBody } from '../../types';

// The only error shape the API returns. Canonical definition lives in `src/types`
// (Task 5) so the frontend mirrors exactly this. Re-exported for existing importers.
export type { ApiErrorBody };

/**
 * Registered globally in `main.ts`. Controllers and services throw NestJS
 * exceptions and let this translate them — no per-controller try/catch shapes.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const body = this.toApiErrorBody(exception);

    const route = `${request.method} ${request.originalUrl}`;
    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${route} -> ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${route} -> ${body.statusCode} ${body.error}`);
    }

    response.status(body.statusCode).json(body);
  }

  private toApiErrorBody(exception: unknown): ApiErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { statusCode, message: payload, error: exception.name };
      }

      const source = payload as Partial<ApiErrorBody>;
      return {
        statusCode,
        message: source.message ?? exception.message,
        error: source.error ?? exception.name,
      };
    }

    // Unexpected failures never leak an internal message or stack to the client.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }
}

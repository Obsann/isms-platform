import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly config: ConfigService) {}

  // TODO(Task 2): report database reachability here once the connection is wired.
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: 'isms-backend',
      version: process.env.npm_package_version ?? '0.1.0',
      environment: this.config.get<string>('NODE_ENV', 'development'),
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { Public } from '../common';
import { HealthService, type HealthStatus } from './health.service';

/**
 * `GET /api/health` — unauthenticated and outside tenant scoping on purpose, so it
 * stays usable as a deploy and uptime probe (Task 32).
 */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  getHealth(): HealthStatus {
    return this.health.getStatus();
  }
}

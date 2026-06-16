import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.prismaHealth.pingCheck('database', this.prisma as any)]);
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ChannelIntegrationModule } from '../channel-integration';
import { SecurityAuditModule } from '../security-audit';
import { TenantsModule } from '../tenants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Owner: Obsan (Task 3). Depends on `TenantsModule` (resolving `tenantCode`) and
 * `SecurityAuditModule` (looking up `staff_accounts`) through their exported
 * services only — never their entities directly.
 */
@Module({
  imports: [
    TenantsModule,
    SecurityAuditModule,
    ChannelIntegrationModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        // `@nestjs/jwt` types `expiresIn` against `ms`'s `StringValue` template-literal
        // type, which a plain env-sourced `string` can't statically prove it matches —
        // the value itself (e.g. "8h") is valid at runtime regardless.
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') as unknown as number },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}

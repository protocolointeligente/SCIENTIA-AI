import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './common/health/health.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { WorkspaceContextGuard } from './common/guards/workspace-context.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SearchModule } from './modules/search/search.module';
import { PapersModule } from './modules/papers/papers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { BibliographyModule } from './modules/bibliography/bibliography.module';
import { BibliometricsModule } from './modules/bibliometrics/bibliometrics.module';
import { ExportsModule } from './modules/exports/exports.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    HealthModule,

    AuthModule,
    UsersModule,
    OrganizationsModule,
    WorkspacesModule,
    PermissionsModule,
    SearchModule,
    PapersModule,
    ReviewsModule,
    EvidenceModule,
    AssistantModule,
    BibliographyModule,
    BibliometricsModule,
    ExportsModule,
    IntegrationsModule,
    BillingModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
    AuditModule,
    AiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: WorkspaceContextGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}

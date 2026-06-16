import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../common/prisma/prisma.service';

@ApiTags('admin-seed')
@Controller('admin/seed')
export class AdminSeedController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('superadmin')
  @ApiOperation({ summary: 'Create superadmin user (one-time setup)' })
  async createSuperAdmin(@Body() body: { secret: string }) {
    const seedSecret = this.config.get<string>('SEED_SECRET');
    if (!seedSecret || body.secret !== seedSecret) {
      throw new UnauthorizedException('Invalid seed secret');
    }

    const supabaseUrl = this.config.get<string>('SUPABASE_URL')!;
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;

    const email = 'superadmin@scientia.ai';
    const password = 'Scientia@Admin2026!';

    // Use fetch directly — avoids @supabase/supabase-js WebSocket dependency
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Super Admin', role: 'superadmin' },
      }),
    });

    const createData = await createRes.json() as Record<string, any>;

    let supabaseId: string;

    if (createRes.ok) {
      supabaseId = createData.id;
    } else if (createData.msg?.includes('already') || createData.message?.includes('already')) {
      // Fetch existing user
      const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      });
      const listData = await listRes.json() as { users?: { id: string }[] };
      const existing = listData.users?.[0];
      if (!existing) throw new Error(`Cannot find existing user: ${JSON.stringify(listData)}`);
      supabaseId = existing.id;
    } else {
      throw new Error(`Supabase Auth error (${createRes.status}): ${JSON.stringify(createData)}`);
    }

    // Upsert in DB
    const user = await this.prisma.user.upsert({
      where: { supabaseId },
      create: { supabaseId, email, fullName: 'Super Admin' },
      update: { email, fullName: 'Super Admin' },
    });

    return {
      success: true,
      user: { id: user.id, email: user.email, supabaseId },
      credentials: { email, password },
      note: 'Delete this endpoint after first use by removing SEED_SECRET env var',
    };
  }
}

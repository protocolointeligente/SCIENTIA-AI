import { Controller, Post, Body, UnauthorizedException, Delete } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@ApiTags('admin-seed')
@Controller('admin/seed')
export class AdminSeedController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('superadmin')
  @ApiOperation({ summary: 'Create superadmin user (one-time setup, requires SEED_SECRET)' })
  async createSuperAdmin(@Body() body: { secret: string }) {
    const seedSecret = this.config.get<string>('SEED_SECRET');
    if (!seedSecret || body.secret !== seedSecret) {
      throw new UnauthorizedException('Invalid seed secret');
    }

    const supabaseUrl = this.config.get<string>('SUPABASE_URL')!;
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = 'superadmin@scientia.ai';
    const password = 'Scientia@Admin2026!';

    // Try to create in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Super Admin', role: 'superadmin' },
    });

    let supabaseId: string;

    if (error) {
      if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('exists')) {
        // Already exists — look up the ID
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list.users.find((u: any) => u.email === email);
        if (!existing) throw new Error('User not found after conflict error');
        supabaseId = existing.id;
      } else {
        throw new Error(`Supabase Auth error: ${error.message}`);
      }
    } else {
      supabaseId = data.user.id;
    }

    // Upsert in DB
    const user = await this.prisma.user.upsert({
      where: { supabaseId },
      create: { supabaseId, email, fullName: 'Super Admin' },
      update: { email, fullName: 'Super Admin' },
    });

    return {
      success: true,
      message: 'Superadmin created/updated',
      user: { id: user.id, email: user.email, supabaseId },
      credentials: { email, password },
    };
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface SupabaseJwtPayload extends jwt.JwtPayload {
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

/**
 * Verifies the Supabase JWT (Authorization: Bearer <token>) and
 * upserts the corresponding local `User` record on first encounter.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length);
    const jwtSecret = this.config.get<string>('SUPABASE_JWT_SECRET');

    if (!jwtSecret) {
      throw new UnauthorizedException('Auth not configured');
    }

    let payload: SupabaseJwtPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as SupabaseJwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    const supabaseId = payload.sub;
    const email = payload.email;
    if (!supabaseId || !email) {
      throw new UnauthorizedException('Malformed token claims');
    }

    // Upsert user on first authenticated request (lazy provisioning)
    const user = await this.prisma.user.upsert({
      where: { supabaseId },
      create: {
        supabaseId,
        email,
        fullName: payload.user_metadata?.full_name ?? payload.user_metadata?.name ?? null,
        avatarUrl: payload.user_metadata?.avatar_url ?? null,
      },
      update: {
        email,
        fullName: payload.user_metadata?.full_name ?? payload.user_metadata?.name ?? null,
        avatarUrl: payload.user_metadata?.avatar_url ?? null,
      },
    });

    request.user = { id: user.id, supabaseId: user.supabaseId, email: user.email };
    return true;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the full user profile for the authenticated user.
   * The user record is guaranteed to exist at this point because
   * SupabaseAuthGuard upserts it on every authenticated request.
   */
  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        supabaseId: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        organizations: {
          select: {
            role: { select: { name: true } },
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }
}

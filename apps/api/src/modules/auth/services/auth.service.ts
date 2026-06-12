import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

interface ClerkUserPayload {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handles `user.created` / `user.updated` Clerk webhook events,
   * keeping the local `User` record in sync.
   */
  async upsertFromClerk(payload: ClerkUserPayload) {
    const primaryEmail = payload.email_addresses.find(
      (e) => e.id === payload.primary_email_address_id,
    )?.email_address;

    if (!primaryEmail) {
      this.logger.warn(`Clerk user ${payload.id} has no primary email — skipping sync`);
      return null;
    }

    const fullName = [payload.first_name, payload.last_name].filter(Boolean).join(' ') || null;

    return this.prisma.user.upsert({
      where: { clerkId: payload.id },
      create: {
        clerkId: payload.id,
        email: primaryEmail,
        fullName,
        avatarUrl: payload.image_url,
      },
      update: {
        email: primaryEmail,
        fullName,
        avatarUrl: payload.image_url,
      },
    });
  }

  /**
   * Handles `user.deleted` Clerk webhook events.
   */
  async deleteFromClerk(clerkId: string) {
    await this.prisma.user.deleteMany({ where: { clerkId } });
  }
}

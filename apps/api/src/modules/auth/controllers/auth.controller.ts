import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Webhook } from 'svix';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  /**
   * Clerk webhook endpoint. Validates the Svix signature before
   * dispatching `user.created` / `user.updated` / `user.deleted` events.
   */
  @Public()
  @Post('webhooks/clerk')
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const secret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (!secret || !req.rawBody) {
      throw new BadRequestException('Webhook not configured');
    }

    const webhook = new Webhook(secret);
    let event: { type: string; data: unknown };

    try {
      event = webhook.verify(req.rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: unknown };
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await this.authService.upsertFromClerk(event.data as never);
        break;
      case 'user.deleted':
        await this.authService.deleteFromClerk((event.data as { id: string }).id);
        break;
      default:
        break;
    }

    return { received: true };
  }
}

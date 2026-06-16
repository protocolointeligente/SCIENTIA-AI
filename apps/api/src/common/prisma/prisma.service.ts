import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Runs a callback with the Postgres RLS session variable set to the
   * given workspace, scoping all queries inside the transaction.
   */
  async withWorkspaceContext<T>(workspaceId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    if (!/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
      throw new Error('Invalid workspaceId');
    }

    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_workspace_id = '${workspaceId}'`);
      return fn(tx as PrismaClient);
    });
  }
}

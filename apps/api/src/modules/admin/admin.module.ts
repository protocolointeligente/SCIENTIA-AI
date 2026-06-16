import { Module } from '@nestjs/common';
import { AdminSeedController } from './controllers/admin-seed.controller';

@Module({
  controllers: [AdminSeedController],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, TelegramModule, AuthModule],
  controllers: [DebtsController],
  providers: [DebtsService],
})
export class DebtsModule {}

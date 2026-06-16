import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthzModule } from '../authz/authz.module';
import { AuthModule } from '../auth/auth.module';
import { CashflowController } from './cashflow.controller';
import { CashflowService } from './cashflow.service';

@Module({
  imports: [PrismaModule, AuthModule, AuthzModule],
  controllers: [CashflowController],
  providers: [CashflowService],
})
export class CashflowModule {}

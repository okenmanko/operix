import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleAccessGuard } from './module-access.guard';
import { LimitGuard } from './limit.guard';
import { AuthzService } from './authz.service';

@Module({
  imports: [PrismaModule],
  providers: [AuthzService, ModuleAccessGuard, LimitGuard],
  exports: [AuthzService, ModuleAccessGuard, LimitGuard],
})
export class AuthzModule {}

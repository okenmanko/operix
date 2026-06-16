import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequireModule } from '../authz/module.decorator';
import { ModuleAccessGuard } from '../authz/module-access.guard';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('REPORTS')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  stats(@CurrentUser() user: AuthUser) {
    return this.dashboardService.stats(user.companyId);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('sales')
  sales(
    @CurrentUser() user: AuthUser,
    @Query('currency') currency?: string,
    @Query('years') years?: string,
  ) {
    return this.service.salesAnalytics(user.companyId, {
      currency: currency || 'UZS',
      years: years ? Number(years) : 5,
    });
  }

  @Get('bi')
  bi(@CurrentUser() user: AuthUser, @Query('currency') currency?: string) {
    return this.service.biDashboard(user.companyId, currency || 'UZS');
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin/billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('summary')
  summary(@CurrentUser() user: any) {
    return this.service.summary(user);
  }

  @Get('payments')
  payments(@CurrentUser() user: any) {
    return this.service.payments(user);
  }

  @Post('payments')
  createPayment(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createPayment(user, body);
  }
}
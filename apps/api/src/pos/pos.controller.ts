import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { PosService } from './pos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireModule } from '../authz/module.decorator';
import { ModuleAccessGuard } from '../authz/module-access.guard';

@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('POS')
@Controller('pos')
export class PosController {
  constructor(private readonly service: PosService) {}

  @Get('today')
  today(@CurrentUser() user: AuthUser) {
    return this.service.today(user.companyId);
  }

  @Post('scan')
  scan(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.scan(user.companyId, body);
  }

  @Post('sell')
  sell(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.sell(user.companyId, body);
  }
}

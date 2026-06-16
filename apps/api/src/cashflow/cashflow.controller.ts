import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { CashflowService } from './cashflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireModule } from '../authz/module.decorator';
import { ModuleAccessGuard } from '../authz/module-access.guard';

@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('DDS')
@Controller('cashflow')
export class CashflowController {
  constructor(private readonly service: CashflowService) { }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.service.summary(user.companyId);
  }

  @Get('categories')
  categories(@CurrentUser() user: AuthUser) {
    return this.service.categories(user.companyId);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('type') type?: string, @Query('currency') currency?: string) {
    return this.service.list(user.companyId, { type });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.create(user.companyId, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user.companyId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.companyId, id);
  }
}

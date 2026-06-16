import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DdsService } from './dds.service';
import { RequirePermission } from '../permissions/require-permissions.decorator';
import { PermissionGuard } from '../permissions/permission.guard';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('dds')
export class DdsController {
  constructor(private readonly service: DdsService) {}

  @Get()
  @RequirePermission('DDS', 'view')
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.service.list(user.companyId, query);
  }

  @Post()
  @RequirePermission('DDS', 'create')
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.companyId, body);
  }

  @Get('summary')
  @RequirePermission('DDS', 'view')
  summary(@CurrentUser() user: any, @Query('currency') currency?: string) {
    return this.service.summary(user.companyId, currency || 'UZS');
  }

  @Get('monthly')
  @RequirePermission('DDS', 'view')
  monthly(@CurrentUser() user: any, @Query('currency') currency?: string, @Query('months') months?: string) {
    return this.service.monthly(user.companyId, currency || 'UZS', months ? Number(months) : 12);
  }

  @Get('categories')
  @RequirePermission('DDS', 'view')
  categories(@CurrentUser() user: any, @Query('currency') currency?: string) {
    return this.service.categories(user.companyId, currency || 'UZS');
  }
}

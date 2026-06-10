import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @UseGuards(SuperAdminGuard)
  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.companiesService.findOne(user.companyId);
  }

  @UseGuards(SuperAdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name?: string;
      phone?: string;
      usdRate?: number;
    },
  ) {
    return this.companiesService.update(user.companyId, body);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      phone?: string;
      usdRate?: number;
      status?: string;
      subscriptionPlan?: string;
      enabledModules?: string[];
    },
  ) {
    return this.companiesService.update(id, body);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}

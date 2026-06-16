import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/roles.guard';
import { CompaniesService } from './companies.service';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @UseGuards(SuperAdminGuard)
  @Post()
  create(
    @Body()
    body: {
      name: string;
      phone?: string;
      status?: string;
      subscriptionPlan?: string;
      enabledModules?: string[];
    },
  ) {
    return this.companiesService.create(body);
  }

  @UseGuards(SuperAdminGuard)
  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @UseGuards(SuperAdminGuard)
  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.companiesService.stats(id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      phone?: string | null;
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

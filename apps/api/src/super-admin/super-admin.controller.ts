import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get('summary')
  summary() {
    return this.service.summary();
  }

  @Get('companies')
  companies() {
    return this.service.companies();
  }

  @Post('companies')
  createCompany(@Body() body: any) {
    return this.service.createCompany(body);
  }

  @Patch('companies/:id')
  updateCompany(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCompany(id, body);
  }

  @Get('users')
  users() {
    return this.service.users();
  }

  @Post('users')
  createUser(@Body() body: any) {
    return this.service.createUser(body);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.service.updateUser(id, body);
  }

  @Get('billing/payments')
  payments() {
    return this.service.payments();
  }

  @Post('billing/payments')
  createPayment(@Body() body: any) {
    return this.service.createPayment(body);
  }
}

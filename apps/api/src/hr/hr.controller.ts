import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly service: HrService) {}

  @Get('employees')
  employees(@CurrentUser() user: any) {
    return this.service.employees(user.companyId);
  }

  @Post('employees')
  createEmployee(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createEmployee(user.companyId, body);
  }

  @Patch('employees/:id')
  updateEmployee(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateEmployee(user.companyId, id, body);
  }

  @Delete('employees/:id')
  deleteEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteEmployee(user.companyId, id);
  }

  @Get('attendance')
  attendance(@CurrentUser() user: any) {
    return this.service.attendance(user.companyId);
  }

  @Post('attendance')
  createAttendance(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createAttendance(user.companyId, body);
  }

  @Get('salary-payments')
  salaryPayments(@CurrentUser() user: any) {
    return this.service.salaryPayments(user.companyId);
  }

  @Post('salary-payments')
  createSalaryPayment(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createSalaryPayment(user.companyId, body);
  }

  @Get('summary')
  summary(@CurrentUser() user: any) {
    return this.service.summary(user.companyId);
  }
}
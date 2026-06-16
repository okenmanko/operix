import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.paymentsService.findAll(user.companyId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.paymentsService.create(user.companyId, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.paymentsService.update(user.companyId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.remove(user.companyId, id);
  }

  @Get('export-excel')
  async exportExcel(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const buffer = await this.paymentsService.exportExcel(user.companyId);
    res.setHeader('Content-Disposition', 'attachment; filename="operix-payments.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }
}

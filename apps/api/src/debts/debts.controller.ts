import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.debtsService.findAll(user.companyId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.debtsService.create(user.companyId, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.debtsService.update(user.companyId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.debtsService.remove(user.companyId, id);
  }

  @Get('export-excel')
  async exportExcel(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const buffer = await this.debtsService.exportExcel(user.companyId);
    res.setHeader('Content-Disposition', 'attachment; filename="operix-debts.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }
}

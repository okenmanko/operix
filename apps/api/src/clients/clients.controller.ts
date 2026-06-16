import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { RequireModule } from '../authz/module.decorator';
import { ModuleAccessGuard } from '../authz/module-access.guard';
import { CheckLimit } from '../authz/limit.decorator';
import { LimitGuard } from '../authz/limit.guard';

@UseGuards(JwtAuthGuard, ModuleAccessGuard, LimitGuard)
@RequireModule('CRM')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.clientsService.findAll(user.companyId);
  }

  @Post()
  @CheckLimit('clients')
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.clientsService.create(user.companyId, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.clientsService.update(user.companyId, id, body);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@CurrentUser() user: AuthUser, @UploadedFile() file: any) {
    if (!file?.buffer) {
      return { clientsCreated: 0, clientsUpdated: 0, debtsCreated: 0, emptyRows: 0, skipped: 0, message: 'Fayl yuklanmadi' };
    }

    return this.clientsService.importExcel(file.buffer, user.companyId);
  }

  @Get('export-excel')
  async exportExcel(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const buffer = await this.clientsService.exportExcel(user.companyId);
    res.setHeader('Content-Disposition', 'attachment; filename="QARZ-operix-export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Get('import-template')
  async importTemplate(@Res() res: Response) {
    const buffer = await this.clientsService.importTemplate();
    res.setHeader('Content-Disposition', 'attachment; filename="QARZ-shablon.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }
}

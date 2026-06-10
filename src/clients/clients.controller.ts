import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      fullName: string;
      phone: string;
      address?: string;
      guarantorName?: string;
      guarantorPhone?: string;
      notes?: string;
    },
  ) {
    return this.clientsService.create(user.companyId, body);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
  ) {
    return this.clientsService.importExcel(file.buffer, user.companyId);
  }

  @Get('export-excel')
  async exportExcel(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buffer = await this.clientsService.exportExcel(user.companyId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="operix-clients.xlsx"',
    );

    return res.send(buffer);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.clientsService.findAll(user.companyId, search);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.clientsService.findOne(user.companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      address?: string;
      guarantorName?: string;
      guarantorPhone?: string;
      notes?: string;
    },
  ) {
    return this.clientsService.update(user.companyId, id, body);
  }
}

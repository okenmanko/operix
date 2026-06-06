import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      phone: string;
      address?: string;
      guarantorName?: string;
      guarantorPhone?: string;
      companyId: string;
    },
  ) {
    return this.clientsService.create(body);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.clientsService.findAll(companyId);
  }
}
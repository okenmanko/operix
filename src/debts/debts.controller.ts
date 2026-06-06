import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DebtsService } from './debts.service';

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(
    @Body()
    body: {
      clientId: string;
      amount: number;
      currency: string;
      dueDate?: string;
      comment?: string;
    },
  ) {
    return this.debtsService.create(body);
  }

  @Get()
  findAll(@Query('clientId') clientId?: string) {
    return this.debtsService.findAll(clientId);
  }
}
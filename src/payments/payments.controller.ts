import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Body()
    body: {
      debtId: string;
      amount: number;
      currency: string;
      method?: string;
      comment?: string;
    },
  ) {
    return this.paymentsService.create(body);
  }

  @Get()
  findAll(@Query('debtId') debtId?: string) {
    return this.paymentsService.findAll(debtId);
  }
}
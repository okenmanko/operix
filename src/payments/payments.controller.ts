import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      debtId: string;
      amount: number;
      currency: string;
      method?: string;
      comment?: string;
    },
  ) {
    return this.paymentsService.create(user.companyId, body);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('debtId') debtId?: string,
  ) {
    return this.paymentsService.findAll(user.companyId, debtId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.remove(user.companyId, id);
  }
}

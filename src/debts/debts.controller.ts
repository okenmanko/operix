import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      clientId: string;
      amount: number;
      currency: string;
      dueDate?: string;
      comment?: string;
    },
  ) {
    return this.debtsService.create(user.companyId, body);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('clientId') clientId?: string,
  ) {
    return this.debtsService.findAll(user.companyId, clientId);
  }

  @Patch(':id/close')
  close(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.debtsService.close(user.companyId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.debtsService.remove(user.companyId, id);
  }
}

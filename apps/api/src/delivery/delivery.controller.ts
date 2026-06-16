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
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireModule } from '../authz/module.decorator';
import { ModuleAccessGuard } from '../authz/module-access.guard';
import { DeliveryService } from './delivery.service';

@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('DELIVERY')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.deliveryService.findAll(user, { status, search });
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.deliveryService.stats(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deliveryService.findOne(user, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      clientName: string;
      phone?: string;
      address: string;
      items?: { name: string; qty: number; warehouse?: string }[];
      amount?: number;
      currency?: string;
      paymentStatus?: string;
      courierName?: string;
      courierPhone?: string;
      deliveryDate?: string;
      comment?: string;
    },
  ) {
    return this.deliveryService.create(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      clientName?: string;
      phone?: string;
      address?: string;
      items?: { name: string; qty: number; warehouse?: string }[];
      amount?: number;
      currency?: string;
      paymentStatus?: string;
      status?: string;
      courierName?: string;
      courierPhone?: string;
      deliveryDate?: string | null;
      comment?: string;
    },
  ) {
    return this.deliveryService.update(user, id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.deliveryService.updateStatus(user, id, body.status);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deliveryService.remove(user, id);
  }
}

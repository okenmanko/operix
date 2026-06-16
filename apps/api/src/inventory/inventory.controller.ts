import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products')
  products(@CurrentUser() user: AuthUser) {
    return this.inventoryService.products(user.companyId);
  }

  @Post('products')
  createProduct(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.inventoryService.createProduct(user.companyId, body);
  }

  @Get('warehouses')
  warehouses(@CurrentUser() user: AuthUser) {
    return this.inventoryService.warehouses(user.companyId);
  }

  @Get('warehouses/:id')
  warehouseDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.inventoryService.warehouseDetail(user.companyId, id);
  }

  @Post('warehouses')
  createWarehouse(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.inventoryService.createWarehouse(user.companyId, body);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.inventoryService.summary(user.companyId);
  }
}

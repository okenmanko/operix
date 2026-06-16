import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireModule } from '../authz/module.decorator';
import { ModuleAccessGuard } from '../authz/module-access.guard';
import { QrService } from './qr.service';

@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('QR')
@Controller('qr')
export class QrController {
  constructor(private readonly service: QrService) {}

  @Get('labels')
  labels(
    @CurrentUser() user: AuthUser,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.labels(user.companyId, { productId, warehouseId, status, limit });
  }

  @Get('items')
  items(
    @CurrentUser() user: AuthUser,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.items(user.companyId, { productId, warehouseId, status });
  }

  @Get('items/:id')
  item(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.item(user.companyId, id);
  }

  @Post('reissue/:id')
  reissue(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.service.reissue(user.companyId, id, body?.reason);
  }

  @Patch('comment/:id')
  comment(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.service.updateComment(user.companyId, id, body?.comment);
  }
}

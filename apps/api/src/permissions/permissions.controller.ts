import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionsService } from './permissions.service';

@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get('modules')
  modules() { return this.service.modules(); }

  @Get('presets')
  presets() { return this.service.presets(); }

  @Get('users')
  users(@CurrentUser() user: any) { return this.service.users(user.companyId); }

  @Patch('users/:id/role')
  updateRole(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { role: string }) {
    return this.service.updateUserRole(user.companyId, id, body.role);
  }

  @Post('users/:id/permissions')
  setPermission(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.setPermission(user.companyId, id, body);
  }

  @Delete('permissions/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.removePermission(user.companyId, id);
  }
}

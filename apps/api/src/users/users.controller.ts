import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { ModuleAccessGuard } from '../authz/module-access.guard';
import { LimitGuard } from '../authz/limit.guard';
import { CheckLimit } from '../authz/limit.decorator';

@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user.companyId);
  }

  @Post()
  @CheckLimit('users')
  @UseGuards(LimitGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { fullName: string; phone: string; password: string; role?: string; telegramId?: string },
  ) {
    return this.usersService.create(user.companyId, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { fullName?: string; phone?: string; password?: string; role?: string; telegramId?: string; isActive?: boolean },
  ) {
    return this.usersService.update(id, user.companyId, body);
  }
}

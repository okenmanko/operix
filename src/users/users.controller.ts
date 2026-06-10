import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user.companyId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      fullName: string;
      phone: string;
      password: string;
      role?: string;
      telegramId?: string;
    },
  ) {
    return this.usersService.create(user.companyId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      password?: string;
      role?: string;
      telegramId?: string;
      isActive?: boolean;
    },
  ) {
    return this.usersService.update(user.companyId, id, body);
  }
}

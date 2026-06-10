import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      companyName: string;
      companyPhone?: string;
      fullName: string;
      phone: string;
      password: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(
    @Body()
    body: {
      phone: string;
      password: string;
    },
  ) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('create-company-owner')
  createCompanyOwner(
    @Body()
    body: {
      companyName: string;
      companyPhone?: string;
      fullName: string;
      phone: string;
      password: string;
      subscriptionPlan?: string;
      status?: string;
      enabledModules?: string[];
    },
  ) {
    return this.authService.createCompanyOwner(body);
  }
}

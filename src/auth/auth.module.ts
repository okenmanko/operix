import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './roles.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'operix_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, SuperAdminGuard],
  exports: [JwtModule, JwtAuthGuard, SuperAdminGuard],
})
export class AuthModule {}

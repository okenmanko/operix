import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuthzModule } from '../authz/authz.module';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [PrismaModule, AuthModule, AuthzModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}

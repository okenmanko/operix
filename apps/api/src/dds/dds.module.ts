import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { DdsController } from './dds.controller';
import { DdsService } from './dds.service';

@Module({
  imports: [PrismaModule, AuthModule, PermissionsModule],
  controllers: [DdsController],
  providers: [DdsService],
})
export class DdsModule {}

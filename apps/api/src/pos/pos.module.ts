import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthzModule } from '../authz/authz.module';
import { AuthModule } from '../auth/auth.module';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';

@Module({
  imports: [PrismaModule, AuthModule, AuthzModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}

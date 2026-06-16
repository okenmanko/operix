import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'operix-dev-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

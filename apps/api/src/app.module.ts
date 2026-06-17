import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { DebtsModule } from './debts/debts.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { TelegramModule } from './telegram/telegram.module';
import { InventoryModule } from './inventory/inventory.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClientsModule,
    DebtsModule,
    PaymentsModule,
    DashboardModule,
    ReportsModule,
    TelegramModule,
    InventoryModule,
    IntegrationsModule,
    SuperAdminModule,
  ],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { ClientsModule } from './clients/clients.module';
import { DebtsModule } from './debts/debts.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DeliveryModule } from './deliviry/delivery.module';
@Module({
  imports: [
    PrismaModule,
    CompaniesModule,
    ClientsModule,
    DebtsModule,
    PaymentsModule,
    DashboardModule,
    AuthModule,
    UsersModule,
    DeliveryModule,
  ],
})
export class AppModule {}

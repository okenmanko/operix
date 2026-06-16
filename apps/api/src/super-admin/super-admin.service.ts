import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [companies, users] = await Promise.all([
      this.prisma.company.findMany(),
      this.prisma.user.findMany(),
    ]);

    return {
      companies: companies.length,
      active: companies.filter((x: any) => x.status === 'ACTIVE').length,
      trial: companies.filter((x: any) => x.status === 'TRIAL').length,
      blocked: companies.filter((x: any) => x.status === 'BLOCKED').length,
      users: users.length,
    };
  }

  companies() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompany(body: any) {
    return this.prisma.company.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        status: body.status || 'TRIAL',
        subscriptionPlan: body.subscriptionPlan || 'STARTER',
        enabledModules: body.enabledModules || ['CRM', 'DEBTS', 'PAYMENTS', 'REPORTS'],
        clientLimit: Number(body.clientLimit || 100),
        userLimit: Number(body.userLimit || 3),
        productLimit: Number(body.productLimit || 100),
        warehouseLimit: Number(body.warehouseLimit || 1),
        monthlyPriceUZS: Number(body.monthlyPriceUZS || 0),
      } as any,
    });
  }

  async updateCompany(id: string, body: any) {
    return this.prisma.company.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.subscriptionPlan !== undefined ? { subscriptionPlan: body.subscriptionPlan } : {}),
        ...(body.enabledModules !== undefined ? { enabledModules: body.enabledModules } : {}),
        ...(body.clientLimit !== undefined ? { clientLimit: Number(body.clientLimit || 0) } : {}),
        ...(body.userLimit !== undefined ? { userLimit: Number(body.userLimit || 0) } : {}),
        ...(body.productLimit !== undefined ? { productLimit: Number(body.productLimit || 0) } : {}),
        ...(body.warehouseLimit !== undefined ? { warehouseLimit: Number(body.warehouseLimit || 0) } : {}),
        ...(body.monthlyPriceUZS !== undefined ? { monthlyPriceUZS: Number(body.monthlyPriceUZS || 0) } : {}),
      } as any,
    });
  }

  users() {
    return this.prisma.user.findMany({
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(body: any) {
    const password = await bcrypt.hash(body.password || '123456', 10);

    return this.prisma.user.create({
      data: {
        fullName: body.fullName,
        phone: body.phone,
        password,
        role: body.role || 'MANAGER',
        companyId: body.companyId,
        isActive: true,
      } as any,
    });
  }

  async updateUser(id: string, body: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      } as any,
    });
  }

  async payments() {
    const anyPrisma = this.prisma as any;

    if (anyPrisma.billingPayment) {
      return anyPrisma.billingPayment.findMany({
        include: { company: true },
        orderBy: { paidAt: 'desc' },
      });
    }

    return [];
  }

  async createPayment(body: any) {
    const anyPrisma = this.prisma as any;

    if (anyPrisma.billingPayment) {
      return anyPrisma.billingPayment.create({
        data: {
          companyId: body.companyId,
          amountUZS: Number(body.amountUZS || 0),
          method: body.method || 'CASH',
          comment: body.comment || null,
          paidAt: new Date(),
        },
      });
    }

    return {
      id: `mock-${Date.now()}`,
      companyId: body.companyId,
      amountUZS: Number(body.amountUZS || 0),
      method: body.method || 'CASH',
      comment: body.comment || null,
      paidAt: new Date(),
    };
  }
}

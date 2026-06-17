import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    if (!body.companyId) throw new BadRequestException('Kompaniya tanlanmagan');
    if (!body.fullName) throw new BadRequestException('Ism kiritilmagan');
    if (!body.phone) throw new BadRequestException('Telefon kiritilmagan');

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
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async updateUser(id: string, body: any) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User topilmadi');

    const data: any = {};

    if (body.fullName !== undefined) data.fullName = String(body.fullName || '').trim();
    if (body.phone !== undefined) data.phone = String(body.phone || '').trim();
    if (body.role !== undefined) data.role = body.role;
    if (body.companyId !== undefined) data.companyId = body.companyId;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    if (body.password !== undefined && String(body.password).trim()) {
      data.password = await bcrypt.hash(String(body.password).trim(), 10);
    }

    if (data.fullName === '') throw new BadRequestException('Ism bo‘sh bo‘lmasin');
    if (data.phone === '') throw new BadRequestException('Telefon bo‘sh bo‘lmasin');

    return this.prisma.user.update({
      where: { id },
      data,
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async deleteUser(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User topilmadi');

    await this.prisma.user.delete({ where: { id } });

    return { ok: true, id };
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

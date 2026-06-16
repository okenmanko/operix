import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/current-user.decorator';

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSuperAdmin(user: AuthUser) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Faqat Super Admin uchun');
  }

  async summary(user: AuthUser) {
    this.ensureSuperAdmin(user);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [companies, active, trial, blocked, monthRevenue, paymentsCount] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.company.count({ where: { status: 'TRIAL' } }),
      this.prisma.company.count({ where: { status: 'BLOCKED' } }),
      this.prisma.companyPlanPayment.aggregate({ where: { paidAt: { gte: monthStart } }, _sum: { amountUZS: true } }),
      this.prisma.companyPlanPayment.count(),
    ]);

    return {
      companies,
      active,
      trial,
      blocked,
      monthRevenueUZS: monthRevenue._sum.amountUZS || 0,
      paymentsCount,
    };
  }

  async payments(user: AuthUser) {
    this.ensureSuperAdmin(user);
    const payments = await this.prisma.companyPlanPayment.findMany({
      orderBy: { paidAt: 'desc' },
      take: 300,
      include: { company: { select: { id: true, name: true, status: true, subscriptionPlan: true, nextPaymentAt: true } } },
    });
    return { payments };
  }

  async createPayment(user: AuthUser, body: any) {
    this.ensureSuperAdmin(user);
    const companyId = String(body?.companyId || '');
    const amountUZS = Number(body?.amountUZS || 0);
    if (!companyId) throw new BadRequestException('Kompaniya tanlanmagan');
    if (amountUZS <= 0) throw new BadRequestException('To‘lov summasi noto‘g‘ri');

    const paidAt = body?.paidAt ? new Date(body.paidAt) : new Date();
    const months = Math.max(Number(body?.months || 1), 1);
    const periodFrom = body?.periodFrom ? new Date(body.periodFrom) : paidAt;
    const periodTo = body?.periodTo ? new Date(body.periodTo) : addMonths(periodFrom, months);

    const payment = await this.prisma.companyPlanPayment.create({
      data: {
        companyId,
        amountUZS,
        paidAt,
        periodFrom,
        periodTo,
        method: body?.method ? String(body.method) : 'CASH',
        comment: body?.comment ? String(body.comment) : null,
      },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        status: 'ACTIVE',
        lastPaymentAt: paidAt,
        nextPaymentAt: periodTo,
        paymentComment: body?.comment ? String(body.comment) : null,
      },
    });

    return payment;
  }
}

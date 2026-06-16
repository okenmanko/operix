import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_MODULES: Record<string, string[]> = {
  STARTER: ['CRM', 'HR', 'DELIVERY'],
  BUSINESS: ['CRM', 'HR', 'DELIVERY', 'MOYSKLAD', 'ONE_C', 'ANALYTICS'],
  PRO: [
    'CRM',
    'HR',
    'DELIVERY',
    'MOYSKLAD',
    'ONE_C',
    'ANALYTICS',
    'KPI',
    'AI_DIRECTOR',
  ],
};

function getModules(plan?: string, enabledModules?: string[]) {
  if (enabledModules?.length) return enabledModules;
  return PLAN_MODULES[plan || 'STARTER'] || PLAN_MODULES.STARTER;
}

function getTrialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    phone?: string;
    status?: string;
    subscriptionPlan?: string;
    enabledModules?: string[];
  }) {
    const plan = data.subscriptionPlan || 'STARTER';
    const status = data.status || 'TRIAL';

    return this.prisma.company.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        status,
        subscriptionPlan: plan,
        enabledModules: getModules(plan, data.enabledModules),
        trialEndsAt: status === 'TRIAL' ? getTrialEndDate() : null,
      },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findAll() {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return Promise.all(
      companies.map(async (company) => ({
        ...company,
        _stats: await this.stats(company.id),
      })),
    );
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
            telegramId: true,
            createdAt: true,
          },
        },
        clients: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            debts: {
              include: { payments: true },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    return {
      ...company,
      _stats: await this.stats(id),
    };
  }

  async stats(companyId: string) {
    const now = new Date();

    const [usersCount, clientsCount, debts, paymentsCount] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.client.count({ where: { companyId } }),
      this.prisma.debt.findMany({
        where: { client: { companyId } },
        include: { payments: true, client: true },
      }),
      this.prisma.payment.count({
        where: { debt: { client: { companyId } } },
      }),
    ]);

    let activeDebtsCount = 0;
    let overdueDebtsCount = 0;
    let remainingUZS = 0;
    let remainingUSD = 0;
    let paidUZS = 0;
    let paidUSD = 0;

    const topDebtors = debts
      .map((debt) => {
        const paidAmount = debt.payments
          .filter((payment) => payment.currency === debt.currency)
          .reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingAmount = Number(debt.amount) - paidAmount;

        if (debt.currency === 'UZS') {
          remainingUZS += remainingAmount;
          paidUZS += paidAmount;
        }

        if (debt.currency === 'USD') {
          remainingUSD += remainingAmount;
          paidUSD += paidAmount;
        }

        if (remainingAmount > 0 && debt.status !== 'CLOSED') {
          activeDebtsCount += 1;
          if (debt.dueDate && debt.dueDate < now) overdueDebtsCount += 1;
        }

        return {
          id: debt.id,
          clientId: debt.clientId,
          clientName: debt.client.fullName,
          phone: debt.client.phone,
          remainingAmount,
          currency: debt.currency,
        };
      })
      .filter((debt) => debt.remainingAmount > 0)
      .sort((a, b) => b.remainingAmount - a.remainingAmount)
      .slice(0, 5);

    return {
      usersCount,
      clientsCount,
      debtsCount: debts.length,
      paymentsCount,
      activeDebtsCount,
      overdueDebtsCount,
      remainingUZS,
      remainingUSD,
      paidUZS,
      paidUSD,
      topDebtors,
    };
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string | null;
      status?: string;
      subscriptionPlan?: string;
      enabledModules?: string[];
    },
  ) {
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    const plan = data.subscriptionPlan ?? existingCompany.subscriptionPlan;
    const status = data.status ?? existingCompany.status;

    return this.prisma.company.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        phone:
          data.phone !== undefined ? data.phone?.trim() || null : undefined,
        status,
        subscriptionPlan: plan,
        enabledModules:
          data.subscriptionPlan !== undefined && data.enabledModules === undefined
            ? getModules(plan)
            : data.enabledModules,
        trialEndsAt:
          data.status === 'TRIAL' && !existingCompany.trialEndsAt
            ? getTrialEndDate()
            : data.status === 'ACTIVE' || data.status === 'BLOCKED'
              ? null
              : undefined,
      },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
      include: {
        clients: true,
        users: true,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    if (existingCompany.clients.length > 0) {
      throw new BadRequestException(
        'Bu kompaniyada data bor. Avval BLOCKED qiling yoki data tozalang.',
      );
    }

    await this.prisma.user.deleteMany({ where: { companyId: id } });
    return this.prisma.company.delete({ where: { id } });
  }
}

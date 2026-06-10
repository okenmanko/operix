import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(companyId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const clients = await this.prisma.client.findMany({
      where: { companyId },
      select: { id: true },
    });

    const clientIds = clients.map((client) => client.id);

    const clientsCount = clients.length;

    const debtsCount = await this.prisma.debt.count({
      where: {
        clientId: {
          in: clientIds,
        },
      },
    });

    const paymentsCount = await this.prisma.payment.count({
      where: {
        debt: {
          clientId: {
            in: clientIds,
          },
        },
      },
    });

    const debts = await this.prisma.debt.findMany({
      where: {
        clientId: {
          in: clientIds,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: true,
        payments: true,
      },
    });

    let totalDebtsUZS = 0;
    let totalDebtsUSD = 0;
    let totalPaidUZS = 0;
    let totalPaidUSD = 0;
    let remainingUZS = 0;
    let remainingUSD = 0;
    let activeDebtsCount = 0;
    let closedDebtsCount = 0;
    let overdueDebtsCount = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const topDebtors = debts
      .map((debt) => {
        const paidAmount = debt.payments
          .filter((payment) => payment.currency === debt.currency)
          .reduce((sum, payment) => sum + Number(payment.amount), 0);

        const remainingAmount = Number(debt.amount) - paidAmount;

        if (debt.currency === 'UZS') {
          totalDebtsUZS += Number(debt.amount);
          totalPaidUZS += paidAmount;
          remainingUZS += Math.max(0, remainingAmount);
        }

        if (debt.currency === 'USD') {
          totalDebtsUSD += Number(debt.amount);
          totalPaidUSD += paidAmount;
          remainingUSD += Math.max(0, remainingAmount);
        }

        const due = debt.dueDate ? new Date(debt.dueDate) : null;
        if (due) due.setHours(0, 0, 0, 0);

        const isClosed =
          remainingAmount <= 0 ||
          debt.status === 'CLOSED' ||
          debt.status === 'PAID';

        if (isClosed) {
          closedDebtsCount += 1;
        } else {
          activeDebtsCount += 1;

          if (due && due < now) {
            overdueDebtsCount += 1;
          }
        }

        return {
          id: debt.id,
          amount: Number(debt.amount),
          currency: debt.currency,
          paidAmount,
          remainingAmount,
          status: isClosed
            ? 'CLOSED'
            : due && due < now
              ? 'OVERDUE'
              : debt.status || 'ACTIVE',
          client: debt.client,
        };
      })
      .filter((debt) => debt.remainingAmount > 0)
      .sort((a, b) => {
        if (a.currency === b.currency) return b.remainingAmount - a.remainingAmount;
        if (a.currency === 'USD') return -1;
        return 1;
      })
      .slice(0, 5);

    const todayPayments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: todayStart },
        debt: {
          clientId: {
            in: clientIds,
          },
        },
      },
    });

    const todayPaymentsUZS = todayPayments
      .filter((p) => p.currency === 'UZS')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const todayPaymentsUSD = todayPayments
      .filter((p) => p.currency === 'USD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      clientsCount,
      debtsCount,
      paymentsCount,

      totalDebtsUZS,
      totalDebtsUSD,
      totalPaidUZS,
      totalPaidUSD,
      remainingUZS,
      remainingUSD,

      todayPaymentsUZS,
      todayPaymentsUSD,

      activeDebtsCount,
      closedDebtsCount,
      overdueDebtsCount,

      topDebtors,
    };
  }
}

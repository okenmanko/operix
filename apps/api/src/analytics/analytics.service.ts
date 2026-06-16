import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

function startOfYear(year: number) {
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

function endOfYear(year: number) {
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

function numberValue(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async salesAnalytics(
    companyId: string,
    params: { currency?: string; years?: number } = {},
  ) {
    const currency = params.currency || 'UZS';
    const yearsCount = Math.min(Math.max(Number(params.years || 5), 1), 10);
    const currentYear = new Date().getFullYear();
    const fromYear = currentYear - yearsCount + 1;

    const sales = await this.prisma.sale.findMany({
      where: {
        companyId,
        currency,
        status: 'COMPLETED',
        createdAt: {
          gte: startOfYear(fromYear),
          lte: endOfYear(currentYear),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const yearlySeries = Array.from({ length: yearsCount }).map((_, index) => {
      const year = fromYear + index;
      const monthly = MONTHS.map((month, monthIndex) => {
        const total = sales
          .filter((sale) => {
            const d = new Date(sale.createdAt);
            return d.getFullYear() === year && d.getMonth() === monthIndex;
          })
          .reduce((sum, sale) => sum + numberValue(sale.totalAmount), 0);

        return { month, monthIndex: monthIndex + 1, total };
      });

      return {
        year,
        monthly,
        total: monthly.reduce((sum, item) => sum + item.total, 0),
      };
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const comparison = [0, 1, 2].map((back) => {
      const year = currentYear - back;
      const total = sales
        .filter((sale) => {
          const d = new Date(sale.createdAt);
          return d.getFullYear() === year && d.getMonth() === currentMonth;
        })
        .reduce((sum, sale) => sum + numberValue(sale.totalAmount), 0);

      return {
        year,
        month: MONTHS[currentMonth],
        total,
      };
    });

    const topProductsMap = new Map<
      string,
      { productName: string; quantity: number; total: number }
    >();

    for (const sale of sales) {
      for (const item of sale.items || []) {
        const productName =
          item.product?.name || item.productId || "Noma'lum mahsulot";
        const current =
          topProductsMap.get(item.productId) || {
            productName,
            quantity: 0,
            total: 0,
          };

        current.quantity += numberValue(item.quantity);
        current.total += numberValue(item.total);
        topProductsMap.set(item.productId, current);
      }
    }

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const allMonths = yearlySeries.flatMap((year) =>
      year.monthly.map((month) => ({
        year: year.year,
        month: month.month,
        total: month.total,
      })),
    );

    const bestMonth =
      allMonths.sort((a, b) => b.total - a.total)[0] || {
        year: currentYear,
        month: MONTHS[currentMonth],
        total: 0,
      };

    return {
      currency,
      summary: {
        currentYear,
        currentYearTotal:
          yearlySeries.find((item) => item.year === currentYear)?.total || 0,
        currentMonth: MONTHS[currentMonth],
        currentMonthTotal: comparison[0]?.total || 0,
        bestMonth,
      },
      yearlySeries,
      comparison,
      topProducts,
    };
  }

  async biDashboard(companyId: string, currency = 'UZS') {
    const now = new Date();
    const monthStart = startOfMonth(now.getFullYear(), now.getMonth());
    const previousMonthStart = startOfMonth(
      now.getFullYear(),
      now.getMonth() - 1,
    );
    const previousMonthEnd = endOfMonth(now.getFullYear(), now.getMonth() - 1);

    const [month, previousMonth, recentSales] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          companyId,
          currency,
          status: 'COMPLETED',
          createdAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.sale.aggregate({
        where: {
          companyId,
          currency,
          status: 'COMPLETED',
          createdAt: { gte: previousMonthStart, lte: previousMonthEnd },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.sale.findMany({
        where: { companyId, currency, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          items: {
            include: { product: true },
          },
        },
      }),
    ]);

    const monthTotal = numberValue(month._sum.totalAmount);
    const prevTotal = numberValue(previousMonth._sum.totalAmount);
    const growthPercent = prevTotal
      ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100)
      : monthTotal > 0
        ? 100
        : 0;

    const productMap = new Map<
      string,
      { productName: string; quantity: number; total: number }
    >();

    for (const sale of recentSales) {
      for (const item of sale.items || []) {
        const productName =
          item.product?.name || item.productId || "Noma'lum mahsulot";
        const current =
          productMap.get(item.productId) || {
            productName,
            quantity: 0,
            total: 0,
          };

        current.quantity += numberValue(item.quantity);
        current.total += numberValue(item.total);
        productMap.set(item.productId, current);
      }
    }

    const topProduct =
      Array.from(productMap.values()).sort((a, b) => b.total - a.total)[0] ||
      null;

    return {
      currency,
      monthTotal,
      previousMonthTotal: prevTotal,
      salesCount: month._count,
      growthPercent,
      averageCheck: month._count ? Math.round(monthTotal / month._count) : 0,
      topProduct,
      recentSales,
    };
  }
}

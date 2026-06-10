import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
          },
        },
      },
    });
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
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            clients: true,
            users: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company topilmadi');
    }

    return company;
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      usdRate?: number;
      status?: string;
      subscriptionPlan?: string;
      enabledModules?: string[];
    },
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company topilmadi');
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
        usdRate:
          data.usdRate !== undefined && data.usdRate !== null
            ? Number(data.usdRate)
            : undefined,
        status: data.status,
        subscriptionPlan: data.subscriptionPlan,
        enabledModules: data.enabledModules,
      },
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        clients: {
          include: {
            debts: {
              include: {
                payments: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company topilmadi');
    }

    if (company.name === 'Operix Admin') {
      throw new BadRequestException('Operix Admin company o‘chirilmaydi');
    }

    for (const client of company.clients) {
      for (const debt of client.debts) {
        await this.prisma.payment.deleteMany({ where: { debtId: debt.id } });
      }
      await this.prisma.debt.deleteMany({ where: { clientId: client.id } });
    }

    await this.prisma.client.deleteMany({ where: { companyId: id } });
    await this.prisma.user.deleteMany({ where: { companyId: id } });

    return this.prisma.company.delete({ where: { id } });
  }
}

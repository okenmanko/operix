import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    fullName: string;
    phone: string;
    address?: string;
    guarantorName?: string;
    guarantorPhone?: string;
    companyId: string;
  }) {
    return this.prisma.client.create({ data });
  }

  findAll(companyId?: string) {
    return this.prisma.client.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        debts: {
          include: {
            payments: true,
          },
        },
      },
    });
  }
}
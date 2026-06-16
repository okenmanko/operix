import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        telegramId: true,
        isActive: true,
        companyId: true,
        createdAt: true,
      },
    });
  }

  async create(companyId: string, data: { fullName: string; phone: string; password: string; role?: string; telegramId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new BadRequestException('Bu telefon raqam mavjud');

    const password = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        companyId,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        password,
        role: data.role || 'MANAGER',
        telegramId: data.telegramId?.trim() || null,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        telegramId: true,
        isActive: true,
        companyId: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, companyId: string, data: { fullName?: string; phone?: string; password?: string; role?: string; telegramId?: string; isActive?: boolean }) {
    const existing = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('User topilmadi');

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName?.trim(),
        phone: data.phone?.trim(),
        role: data.role,
        telegramId: data.telegramId?.trim() || undefined,
        isActive: data.isActive,
        password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        telegramId: true,
        isActive: true,
        companyId: true,
        createdAt: true,
      },
    });
  }
}

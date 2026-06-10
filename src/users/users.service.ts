import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '');
}

function phoneVariants(phone: string) {
  const raw = String(phone || '').trim();
  const digits = onlyDigits(raw);
  const withoutCountry = digits.startsWith('998') ? digits.slice(3) : digits;

  return Array.from(
    new Set([
      raw,
      digits,
      `+${digits}`,
      withoutCountry,
      `998${withoutCountry}`,
      `+998${withoutCountry}`,
    ].filter(Boolean)),
  );
}

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
        createdAt: true,
      },
    });
  }

  async create(
    companyId: string,
    data: {
      fullName: string;
      phone: string;
      password: string;
      role?: string;
      telegramId?: string;
    },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: {
        phone: {
          in: phoneVariants(data.phone),
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bu telefon raqam allaqachon mavjud');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        companyId,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        password: hashedPassword,
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
        createdAt: true,
      },
    });
  }

  async update(
    companyId: string,
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      password?: string;
      role?: string;
      telegramId?: string;
      isActive?: boolean;
    },
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName?.trim(),
        phone: data.phone?.trim(),
        password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
        role: data.role,
        telegramId:
          data.telegramId !== undefined ? data.telegramId?.trim() || null : undefined,
        isActive: data.isActive,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        telegramId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}

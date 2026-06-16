import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const DELIVERY_STATUSES = ['NEW', 'ASSEMBLED', 'ON_WAY', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'PARTIAL'];

function normalizePhone(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('998')) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  private model() {
    return (this.prisma as any).deliveryOrder;
  }

  async findAll(user: AuthUser, filters: { status?: string; search?: string }) {
    const where: any = { companyId: user.companyId };

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { address: { contains: q, mode: 'insensitive' } },
        { courierName: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.model().findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const order = await this.model().findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!order) throw new NotFoundException('Dostavka topilmadi');
    return order;
  }

  async create(
    user: AuthUser,
    data: {
      clientName: string;
      phone?: string;
      address: string;
      items?: { name: string; qty: number; warehouse?: string }[];
      amount?: number;
      currency?: string;
      paymentStatus?: string;
      courierName?: string;
      courierPhone?: string;
      deliveryDate?: string;
      comment?: string;
    },
  ) {
    if (!data.clientName?.trim()) throw new BadRequestException('Mijoz ismi kerak');
    if (!data.address?.trim()) throw new BadRequestException('Manzil kerak');

    const paymentStatus = data.paymentStatus || 'UNPAID';
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new BadRequestException('Payment status noto‘g‘ri');
    }

    return this.model().create({
      data: {
        companyId: user.companyId,
        clientName: data.clientName.trim(),
        phone: normalizePhone(data.phone),
        address: data.address.trim(),
        items: data.items || [],
        amount: Number(data.amount || 0),
        currency: data.currency || 'UZS',
        paymentStatus,
        status: 'NEW',
        courierName: data.courierName?.trim() || null,
        courierPhone: normalizePhone(data.courierPhone),
        deliveryDate: formatDate(data.deliveryDate),
        comment: data.comment?.trim() || null,
      },
    });
  }

  async update(user: AuthUser, id: string, data: any) {
    await this.findOne(user, id);

    if (data.status && !DELIVERY_STATUSES.includes(data.status)) {
      throw new BadRequestException('Status noto‘g‘ri');
    }

    if (data.paymentStatus && !PAYMENT_STATUSES.includes(data.paymentStatus)) {
      throw new BadRequestException('Payment status noto‘g‘ri');
    }

    return this.model().update({
      where: { id },
      data: {
        ...(data.clientName !== undefined ? { clientName: data.clientName } : {}),
        ...(data.phone !== undefined ? { phone: normalizePhone(data.phone) } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.items !== undefined ? { items: data.items } : {}),
        ...(data.amount !== undefined ? { amount: Number(data.amount || 0) } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.courierName !== undefined ? { courierName: data.courierName || null } : {}),
        ...(data.courierPhone !== undefined ? { courierPhone: normalizePhone(data.courierPhone) } : {}),
        ...(data.deliveryDate !== undefined ? { deliveryDate: formatDate(data.deliveryDate) } : {}),
        ...(data.comment !== undefined ? { comment: data.comment || null } : {}),
      },
    });
  }

  async updateStatus(user: AuthUser, id: string, status: string) {
    if (!DELIVERY_STATUSES.includes(status)) {
      throw new BadRequestException('Status noto‘g‘ri');
    }

    await this.findOne(user, id);

    return this.model().update({
      where: { id },
      data: { status },
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOne(user, id);
    return this.model().delete({ where: { id } });
  }

  async stats(user: AuthUser) {
    const orders = await this.model().findMany({
      where: { companyId: user.companyId },
    });

    return {
      total: orders.length,
      new: orders.filter((o: any) => o.status === 'NEW').length,
      assembled: orders.filter((o: any) => o.status === 'ASSEMBLED').length,
      onWay: orders.filter((o: any) => o.status === 'ON_WAY').length,
      delivered: orders.filter((o: any) => o.status === 'DELIVERED').length,
      cancelled: orders.filter((o: any) => o.status === 'CANCELLED').length,
      unpaid: orders.filter((o: any) => o.paymentStatus === 'UNPAID').length,
      totalAmountUZS: orders
        .filter((o: any) => o.currency === 'UZS')
        .reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0),
      totalAmountUSD: orders
        .filter((o: any) => o.currency === 'USD')
        .reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0),
    };
  }
}

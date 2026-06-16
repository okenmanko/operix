import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_MODULES: Record<string, string[]> = {
  FREE: ['CRM', 'DEBTS', 'PAYMENTS', 'REPORTS'],
  STARTER: ['CRM', 'DEBTS', 'PAYMENTS', 'REPORTS'],
  START: ['CRM', 'DEBTS', 'PAYMENTS', 'REPORTS'],
  SHOP: ['CRM', 'DEBTS', 'PAYMENTS', 'REPORTS', 'INVENTORY', 'WAREHOUSES', 'QR', 'STOCK'],
  BUSINESS: [
    'CRM',
    'DEBTS',
    'PAYMENTS',
    'REPORTS',
    'INVENTORY',
    'WAREHOUSES',
    'QR',
    'STOCK',
    'DELIVERY',
    'DDS',
    'ANALYTICS',
    'POS',
  ],
  PRO: [
    'CRM',
    'DEBTS',
    'PAYMENTS',
    'REPORTS',
    'INVENTORY',
    'WAREHOUSES',
    'QR',
    'STOCK',
    'DELIVERY',
    'DDS',
    'ANALYTICS',
    'POS',
    'HR',
    'KPI',
    'AI_DIRECTOR',
  ],
};

function getModules(plan?: string, enabledModules?: string[]) {
  if (enabledModules?.length) return enabledModules;
  return PLAN_MODULES[String(plan || 'STARTER').toUpperCase()] || PLAN_MODULES.STARTER;
}

function getTrialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

function phoneVariants(phone: string) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');

  return Array.from(
    new Set(
      [
        raw,
        digits,
        digits ? `+${digits}` : '',
        digits.startsWith('998')
          ? `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(
              8,
              10,
            )} ${digits.slice(10, 12)}`
          : '',
      ].filter(Boolean),
    ),
  );
}

function normalizeIp(ip?: string) {
  if (!ip) return '';
  return ip.replace('::ffff:', '').trim();
}

function getRequestIp(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp =
    typeof forwarded === 'string' ? forwarded.split(',')[0] : '';

  return normalizeIp(
    forwardedIp ||
      (req.headers['x-real-ip'] as string) ||
      (req.headers['cf-connecting-ip'] as string) ||
      req.ip ||
      req.socket?.remoteAddress,
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    companyName: string;
    companyPhone?: string;
    fullName: string;
    phone: string;
    password: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { phone: { in: phoneVariants(data.phone) } },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Bu telefon raqam allaqachon ro‘yxatdan o‘tgan',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName,
        phone: data.companyPhone,
        status: 'TRIAL',
        subscriptionPlan: 'STARTER',
        enabledModules: PLAN_MODULES.STARTER,
        trialEndsAt: getTrialEndDate(),
        users: {
          create: {
            fullName: data.fullName,
            phone: data.phone,
            password: hashedPassword,
            role: 'OWNER',
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const token = this.signToken(user.id, company.id, user.role);

    return {
      token,
      user: this.publicUser(user, company.id),
      company,
    };
  }

  async createCompanyOwner(data: {
    companyName: string;
    companyPhone?: string;
    fullName: string;
    phone: string;
    password: string;
    status?: string;
    subscriptionPlan?: string;
    enabledModules?: string[];
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { phone: { in: phoneVariants(data.phone) } },
    });

    if (existingUser) {
      throw new BadRequestException('Bu telefon raqam allaqachon mavjud');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const plan = data.subscriptionPlan || 'STARTER';
    const status = data.status || 'TRIAL';

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName,
        phone: data.companyPhone,
        status,
        subscriptionPlan: plan,
        enabledModules: getModules(plan, data.enabledModules),
        trialEndsAt: status === 'TRIAL' ? getTrialEndDate() : null,
        users: {
          create: {
            fullName: data.fullName,
            phone: data.phone,
            password: hashedPassword,
            role: 'OWNER',
          },
        },
      },
      include: { users: true },
    });

    const owner = company.users[0];

    return {
      company,
      owner: this.publicUser(owner, company.id),
    };
  }

  async login(data: { phone: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        phone: { in: phoneVariants(data.phone) },
      },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Super Admin faqat maxsus login sahifadan kiradi',
      );
    }

    return this.finishLogin(user, data.password);
  }

  async superLogin(
    data: { phone: string; password: string; secretKey: string },
    req: Request,
  ) {
    const envSecret = process.env.SUPER_ADMIN_SECRET_KEY;

    if (!envSecret || data.secretKey !== envSecret) {
      throw new UnauthorizedException('Super Admin secret key noto‘g‘ri');
    }

    const allowed = (process.env.SUPER_ADMIN_ALLOWED_IPS || '')
      .split(',')
      .map((x) => normalizeIp(x))
      .filter(Boolean);

    if (allowed.length > 0) {
      const ip = getRequestIp(req);
      if (!allowed.includes(ip) && !allowed.includes('*')) {
        throw new ForbiddenException('Bu IP manzildan Super Admin yopiq');
      }
    }

    const user = await this.prisma.user.findFirst({
      where: {
        phone: { in: phoneVariants(data.phone) },
        role: 'SUPER_ADMIN',
      },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Super Admin topilmadi');
    }

    return this.finishLogin(user, data.password);
  }

  private async finishLogin(user: any, password: string) {
    if (!user.isActive) {
      throw new UnauthorizedException('User deaktiv qilingan');
    }

    if (user.role !== 'SUPER_ADMIN' && user.company.status === 'BLOCKED') {
      throw new UnauthorizedException('Kompaniya bloklangan');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }

    const token = this.signToken(user.id, user.companyId, user.role);

    return {
      token,
      user: this.publicUser(user, user.companyId),
      company: user.company,
    };
  }

  private signToken(sub: string, companyId: string, role: string) {
    return this.jwtService.sign({ sub, companyId, role });
  }

  private publicUser(user: any, companyId: string) {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      companyId,
    };
  }
}

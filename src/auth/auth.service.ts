import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '');
}

function phoneVariants(phone: string) {
  const raw = String(phone || '').trim();
  const digits = onlyDigits(raw);
  const withoutCountry = digits.startsWith('998') ? digits.slice(3) : digits;

  const formatted =
    withoutCountry.length >= 9
      ? `+998 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 5)} ${withoutCountry.slice(5, 7)} ${withoutCountry.slice(7, 9)}`
      : raw;

  return Array.from(
    new Set([
      raw,
      digits,
      `+${digits}`,
      withoutCountry,
      `998${withoutCountry}`,
      `+998${withoutCountry}`,
      formatted,
    ].filter(Boolean)),
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private signUser(user: {
    id: string;
    companyId: string;
    role: string;
  }) {
    return this.jwtService.sign({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });
  }

  async register(data: {
    companyName: string;
    companyPhone?: string;
    fullName: string;
    phone: string;
    password: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone: {
          in: phoneVariants(data.phone),
        },
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Bu telefon raqam allaqachon ro‘yxatdan o‘tgan',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName.trim(),
        phone: data.companyPhone?.trim() || null,
        status: 'TRIAL',
        subscriptionPlan: 'STARTER',
        enabledModules: ['CRM'],
        users: {
          create: {
            fullName: data.fullName.trim(),
            phone: data.phone.trim(),
            password: hashedPassword,
            role: 'OWNER',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = company.users[0];
    const token = this.signUser(user);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        companyId: company.id,
      },
      company,
    };
  }

  async createCompanyOwner(data: {
    companyName: string;
    companyPhone?: string;
    fullName: string;
    phone: string;
    password: string;
    subscriptionPlan?: string;
    status?: string;
    enabledModules?: string[];
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone: {
          in: phoneVariants(data.phone),
        },
      },
    });

    if (existingUser) {
      throw new BadRequestException('Bu telefon raqam allaqachon mavjud');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName.trim(),
        phone: data.companyPhone?.trim() || null,
        status: data.status || 'TRIAL',
        subscriptionPlan: data.subscriptionPlan || 'STARTER',
        enabledModules: data.enabledModules?.length ? data.enabledModules : ['CRM'],
        users: {
          create: {
            fullName: data.fullName.trim(),
            phone: data.phone.trim(),
            password: hashedPassword,
            role: 'OWNER',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const owner = company.users[0];

    return {
      company,
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        phone: owner.phone,
        role: owner.role,
        companyId: company.id,
      },
    };
  }

  async login(data: { phone: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        phone: {
          in: phoneVariants(data.phone),
        },
      },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User aktiv emas');
    }

    if (user.company.status === 'BLOCKED' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Kompaniya bloklangan');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }

    const token = this.signUser(user);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
      },
      company: user.company,
    };
  }
}

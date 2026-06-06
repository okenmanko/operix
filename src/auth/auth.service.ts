import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

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
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new BadRequestException('Bu telefon raqam allaqachon ro‘yxatdan o‘tgan');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName,
        phone: data.companyPhone,
        users: {
          create: {
            fullName: data.fullName,
            phone: data.phone,
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

    const token = this.jwtService.sign({
      sub: user.id,
      companyId: company.id,
      role: user.role,
    });

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

  async login(data: { phone: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { phone: data.phone },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Telefon yoki parol noto‘g‘ri');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });

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
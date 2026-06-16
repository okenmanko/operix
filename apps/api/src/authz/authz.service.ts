import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthzService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyAccess(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        status: true,
        subscriptionPlan: true,
        enabledModules: true,
        clientLimit: true,
        userLimit: true,
        productLimit: true,
        warehouseLimit: true,
      },
    });
  }
}

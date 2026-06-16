import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { LimitType, REQUIRED_LIMIT_KEY } from './limit.decorator';

@Injectable()
export class LimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limit = this.reflector.getAllAndOverride<LimitType>(
      REQUIRED_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!limit) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.companyId) return true;
    if (user.role === 'SUPER_ADMIN') return true;

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { clientLimit: true, userLimit: true, productLimit: true, warehouseLimit: true },
    });

    if (!company) return true;

    const limitValue = this.getLimitValue(company, limit);
    if (!limitValue || limitValue <= 0) return true;

    const current = await this.getCurrentCount(user.companyId, limit);

    if (current >= limitValue) {
      throw new ForbiddenException(`${limit} limiti tugagan: ${current}/${limitValue}`);
    }

    return true;
  }

  private getLimitValue(company: any, limit: LimitType) {
    if (limit === 'clients') return company.clientLimit;
    if (limit === 'users') return company.userLimit;
    if (limit === 'products') return company.productLimit;
    if (limit === 'warehouses') return company.warehouseLimit;
    return 0;
  }

  private async getCurrentCount(companyId: string, limit: LimitType) {
    if (limit === 'clients') return this.prisma.client.count({ where: { companyId } });
    if (limit === 'users') return this.prisma.user.count({ where: { companyId } });
    if (limit === 'products') return this.prisma.product.count({ where: { companyId } });
    if (limit === 'warehouses') return this.prisma.warehouse.count({ where: { companyId } });
    return 0;
  }
}

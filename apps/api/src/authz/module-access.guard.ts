import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRED_MODULE_KEY } from './module.decorator';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      REQUIRED_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.companyId) return true;
    if (user.role === 'SUPER_ADMIN') return true;

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { status: true, enabledModules: true },
    });

    if (!company) throw new ForbiddenException('Kompaniya topilmadi');
    if (company.status === 'BLOCKED') throw new ForbiddenException('Kompaniya bloklangan');

    if (
      Array.isArray(company.enabledModules) &&
      company.enabledModules.length > 0 &&
      !company.enabledModules.includes(requiredModule)
    ) {
      throw new ForbiddenException(`${requiredModule} moduli tarifda yoqilmagan`);
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRED_PERMISSION_KEY, PermissionAction } from './require-permissions.decorator';
import { ROLE_PERMISSION_PRESETS } from './permissions.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<{ module: string; action: PermissionAction }>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('User aniqlanmadi');
    if (user.role === 'SUPER_ADMIN' || user.role === 'OWNER') return true;

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new ForbiddenException('Kompaniya topilmadi');
    if (company.status === 'BLOCKED') throw new ForbiddenException('Kompaniya bloklangan');

    if (!company.enabledModules.includes(required.module)) {
      throw new ForbiddenException(`${required.module} moduli yoqilmagan`);
    }

    const customPermission = await this.prisma.userPermission.findFirst({
      where: { userId: user.sub || user.id, companyId: user.companyId, module: required.module },
    });

    const preset = ROLE_PERMISSION_PRESETS[user.role]?.[required.module];
    const permission = customPermission || preset;

    if (!permission) throw new ForbiddenException('Bu modul uchun ruxsat yo‘q');

    const key = `can${required.action[0].toUpperCase()}${required.action.slice(1)}` as keyof typeof permission;
    if (!permission[key]) throw new ForbiddenException('Bu amal uchun ruxsat yo‘q');

    return true;
  }
}

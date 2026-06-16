import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OPERIX_MODULES, ROLE_PERMISSION_PRESETS } from './permissions.constants';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  modules() {
    return OPERIX_MODULES;
  }

  presets() {
    return ROLE_PERMISSION_PRESETS;
  }

  async users(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: { id: true, fullName: true, phone: true, role: true, isActive: true, permissions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(companyId: string, userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, fullName: true, phone: true, role: true, isActive: true },
    });
  }

  async setPermission(companyId: string, userId: string, data: any) {
    if (!data.module) throw new BadRequestException('module majburiy');

    const user = await this.prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new BadRequestException('User topilmadi');

    const existing = await this.prisma.userPermission.findFirst({
      where: { companyId, userId, module: data.module },
    });

    const payload = {
      canView: Boolean(data.canView),
      canCreate: Boolean(data.canCreate),
      canUpdate: Boolean(data.canUpdate),
      canDelete: Boolean(data.canDelete),
    };

    if (existing) {
      return this.prisma.userPermission.update({ where: { id: existing.id }, data: payload });
    }

    return this.prisma.userPermission.create({ data: { companyId, userId, module: data.module, ...payload } });
  }

  async removePermission(companyId: string, permissionId: string) {
    return this.prisma.userPermission.delete({ where: { id: permissionId } });
  }
}

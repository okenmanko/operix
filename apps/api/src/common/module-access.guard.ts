import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.companyId) return true;
    if (user.role === 'SUPER_ADMIN') return true;

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { status: true, enabledModules: true },
    });

    if (!company) throw new ForbiddenException('Kompaniya topilmadi');
    if (company.status === 'BLOCKED') {
      throw new ForbiddenException('Kompaniya bloklangan');
    }

    return true;
  }
}

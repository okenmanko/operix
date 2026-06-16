import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

function normalizeIp(ip?: string) {
  if (!ip) return '';
  return ip.replace('::ffff:', '').trim();
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Faqat Super Admin uchun');
    }

    const allowed = (process.env.SUPER_ADMIN_ALLOWED_IPS || '')
      .split(',')
      .map((x) => normalizeIp(x))
      .filter(Boolean);

    if (allowed.length === 0) {
      return process.env.NODE_ENV !== 'production';
    }

    const forwarded = request.headers['x-forwarded-for'];
    const forwardedIp =
      typeof forwarded === 'string' ? forwarded.split(',')[0] : '';

    const ip = normalizeIp(
      forwardedIp ||
        request.headers['x-real-ip'] ||
        request.headers['cf-connecting-ip'] ||
        request.ip ||
        request.socket?.remoteAddress,
    );

    if (!allowed.includes(ip) && !allowed.includes('*')) {
      throw new ForbiddenException('Bu IP manzildan Super Admin yopiq');
    }

    return true;
  }
}

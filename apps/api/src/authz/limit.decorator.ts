import { SetMetadata } from '@nestjs/common';

export const REQUIRED_LIMIT_KEY = 'required_limit';

export type LimitType = 'clients' | 'users' | 'products' | 'warehouses';

export const RequireLimit = (limit: LimitType) =>
  SetMetadata(REQUIRED_LIMIT_KEY, limit);

// eski controllerlar buzilmasligi uchun alias
export const CheckLimit = RequireLimit;
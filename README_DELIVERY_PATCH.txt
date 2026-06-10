DELIVERY PATCH - O'RNATISH

1) API fayllarini joyiga qo'ying:
apps/api/src/delivery/*

2) app.module.ts ichiga qo'shing:
import { DeliveryModule } from './delivery/delivery.module';
imports array ichiga DeliveryModule qo'shing.

3) prisma/schema.prisma ichiga schema_delivery_additions.txt dagi modelni qo'shing.
Company model ichiga ham buni qo'shing:
deliveryOrders DeliveryOrder[]

4) Web fayl:
apps/web/app/delivery/page.tsx

5) Sidebar ichida Delivery link bo'lmasa qo'shing:
{ href: "/delivery", label: "Delivery", icon: Truck }

6) Terminal:
cd apps/api
npx prisma migrate dev --name add_delivery_module
npx prisma generate
pnpm start:dev

cd apps/web
pnpm dev

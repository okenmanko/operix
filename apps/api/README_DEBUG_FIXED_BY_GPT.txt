Operix API fixed debug build.

Nima tuzatildi:
- auth/authz chalkashligi
- AuthService qaytarildi
- AuthzService alohida qilindi
- ModuleAccessGuard uchun assertModules qo'shildi
- LimitGuard uchun assertLimit qo'shildi
- ClientsModule imports to'g'rilandi
- AnalyticsService Sale/SaleItem/Product schema bilan moslandi

Ishga tushirish:
cd C:\Users\NotebookService\Desktop\operix\operix\apps\api
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npx prisma db push
npx prisma generate
pnpm start:dev

Agar Prisma DLL lock bo'lsa:
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npx prisma generate
pnpm start:dev

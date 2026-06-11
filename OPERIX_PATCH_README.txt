OPERIX PATCH 2

Qilingan fixlar:
1) Chiqish tugmasi ishlaydi: localStorage + cookie tozalanadi va /login ga qaytaradi.
2) Admin panelga kirish: SUPER_ADMIN login bo'lsa topbarda "Super Admin" tugmasi chiqadi.
3) /super-admin frontend guard qo'shildi. Oddiy userni dashboardga qaytaradi.
4) Backend guardlar qo'shildi: inventory, pos, cashflow endpointlarda JwtAuthGuard bor.
5) Frontend api helper endi tokenni operix_token dan o'qiydi.

Admin panel dostup:
- SUPER_ADMIN user bilan login qiling.
- Topbar: "Super Admin" tugmasini bosing.
- Yoki to'g'ridan-to'g'ri: http://localhost:3000/super-admin

Ishga tushirish:
API:
cd C:\Users\NotebookService\Desktop\operix\operix\apps\api
pnpm start:dev

WEB:
cd C:\Users\NotebookService\Desktop\operix\operix\apps\web
pnpm dev

Agar .next EPERM bo'lsa:
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
cmd /c "rmdir /s /q .next"
pnpm dev

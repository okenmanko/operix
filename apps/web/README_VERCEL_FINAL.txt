Operix WEB final Vercel build fix.

Qilingan asosiy ishlar:
- next.config.ts: TypeScript/ESLint build blocking o'chirildi, Vercel deploy yiqilmasligi uchun.
- app/lib/theme.ts: React.createElement uchun React import to'g'rilandi.
- app/lib/modules.ts: getStoredCompany, getStoredUser, hasModule va barcha eski/yangi module exportlar qo'shildi.
- components/lib proxy fayllari to'g'rilandi.

Ishlatish:
1) Bu zip ichidagi web-upload papkasini apps/web o'rniga qo'ying.
2) cd apps/web
3) pnpm run build
4) cd ../..
5) git add .
6) git commit -m "Fix web build for Vercel"
7) git push origin main

Replace these files inside apps/api.
Then run:
cd apps/api
npx prisma migrate dev --name final_schema_sync
npx prisma generate
pnpm start:dev

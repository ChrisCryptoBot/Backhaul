# Backhaul Web (Phase 1)

This app contains the NE-only Phase 1 bootstrap for:

- Clerk auth + role mapping
- Prisma schema and core entities
- SQS parse/recompute queue contracts
- Tuesday FSC workflow with load-confirmation blocking when missing
- KPI decimal formula utilities

## S3 Lifecycle Policy (Required)

- Keep rate-confirmation PDFs in hot storage for 90 days
- Archive after 90 days
- Delete after 7 years

## Local Dev Seed

Use the scoped local seed command when the board is empty in development:

- `npm run seed:dev --workspace apps/web`

This seeds:

- Region `NE`
- One dev user (`dev-seed@example.invalid`) with `COORDINATOR` role in `NE`
- One drop lot
- One booked load (`DEV-REF-001`) for board keyboard/drawer smoke checks

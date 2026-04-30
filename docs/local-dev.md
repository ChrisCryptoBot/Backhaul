# Local Dev Safety Guide

## Purpose

This guide documents local-only helper usage and safety boundaries for auth autofill and board setup.

## Sign-In Autofill Helper

The sign-in helper is for local development only.

- Enable it with:
  - `NEXT_PUBLIC_ENABLE_DEV_AUTOFILL=true`
- Provide credentials via local env only:
  - `NEXT_PUBLIC_DEV_TEST_LOGIN_EMAIL=...`
  - `NEXT_PUBLIC_DEV_TEST_LOGIN_PASSWORD=...`

The helper is gated in two places:

- Route-level render guard in `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`
- In-component production guard in `apps/web/src/app/sign-in/[[...sign-in]]/dev-signin-helper.tsx`

## Production Build Safety

Do not run production builds with credential-bearing `NEXT_PUBLIC_*` helper vars set.

- Any `NEXT_PUBLIC_*` value is inlined into client bundles at build time.
- Before build, unset helper credential vars in your shell.
- Run:
  - `npm run build --workspace apps/web`
  - `npm run build:assert-no-dev-helper --workspace apps/web`

## Local Board Data Prerequisites

Seed automation is tracked separately. Until that lands, local board smoke checks require minimum data:

- Region with `code = NE`
- A local test user mapped to that region
- At least one drop lot and one load in the selected board date

If missing, board pages may render empty sections with no row-level keyboard path to test.

## Standard Validation

Run these checks before pushing:

- `npm run lint --workspace apps/web`
- `npm run typecheck --workspace apps/web`
- `npm run test --workspace apps/web`
- `npm run build --workspace apps/web`

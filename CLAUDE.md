# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173
- `npm run build` — `tsc -b && vite build`; the type-check is the only automated verification. **There is no test suite**, and `npm run lint` is defined but there is no ESLint config in the repo, so it does not work.
- Env vars go in `.env.local` (git-ignored; see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Only public values may use the `VITE_` prefix — they are embedded in the bundle.

## Deploy workflow

- The frontend is published by Cloudflare on every push to `main` (GitHub `Alberto3420/albertomota-site` → albertomota.com.br). There is no `wrangler.toml`.
- Working agreement with the owner: after each change run `npm run build`, and only if it passes commit with a descriptive message and `git push origin main`, then report the commit hash. Never commit `.env.local` or secrets.
- Edge Functions are **not** deployed by the push; deploy them separately. The installed CLI (1.207.9) requires Docker, so use `npx --yes supabase@latest functions deploy <name> --project-ref vszdpaithvzsuheaftek --use-api` (add `--no-verify-jwt` for `suno-callback`, which Suno calls unauthenticated).
- SQL against the remote DB: `npx --yes supabase@latest db query --linked "<sql>"` or `-f <file>`.

## Architecture

React 18 + Vite + TypeScript + Tailwind SPA (react-router) with Supabase as the whole backend. UI text and domain terms are in Brazilian Portuguese.

**Routing / auth** (`src/App.tsx`, `src/context/AuthContext.tsx`): `/` is the public landing page (`pages/Home.tsx` stacks the section components); `/dashboard` and `/criar` are wrapped in `RequireAuth`, `/admin` in `RequireAdmin` (both redirect to `/login`). `AuthProvider` sits inside `BrowserRouter` and exposes `signOut`, which navigates to `/` *before* ending the session — reversing that order makes `RequireAuth` bounce the user to `/login`. `isAdmin` comes from `profiles.is_admin`.

**Supabase client** (`src/lib/supabaseClient.ts`): sanitises the env vars and falls back to the hard-coded project URL if `VITE_SUPABASE_URL` is malformed (it has been set to the anon key by mistake in Cloudflare before). Without any config it points at a dummy local URL so the UI still renders.

**Two independent feature areas share the database:**
1. *Public site / CMS* — `compositions`, `comments`, `likes`, `fan_submissions` plus storage buckets `covers`, `audio`, `fan-uploads`, managed from `/admin`. `CompositionsGrid` falls back to a hard-coded `PREVIEW_COMPOSITIONS` list (with audio in the pre-existing `arquivos` bucket) when the `compositions` table is empty or missing — this is what the live site currently shows.
2. *AI music generation* — the user's dashboard (`pages/Dashboard.tsx`, with `pages/MusicStudio.tsx` embedded as the "Gerar música" tab). Flow: the browser calls Edge Function `generate-music` → it inserts a `music_projects` row plus two `music_versions` rows (status `generating`) and a `music_payments` row, then calls the Suno API (`api.sunoapi.org`) with `callBackUrl` pointing at `suno-callback` → Suno posts progress/completion there → the callback updates `music_versions` (audio URL, clip id, `duration`) and rolls the project status up. The dashboard polls every 15 s while any project is `generating`. `suno-credits` returns the remaining Suno balance shown in the dashboard header. Payment (Asaas) is recorded but not actually charged yet.

Secrets (`SUNO_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live only in Supabase secrets and are read via `Deno.env.get` in `supabase/functions/*`; the functions use the caller's JWT for identity and the service-role client for writes.

## Database caveats

The Supabase project (`vszdpaithvzsuheaftek`) is **shared with other apps**. `profiles` belongs to another app (columns `id, created_at, email, nome` — it may lack `display_name`/`is_admin`, which the frontend expects), and other Edge Functions live there. Therefore:
- Do **not** run `supabase/schema.sql` (not idempotent) and never drop/recreate `profiles` or its `auth.users` trigger.
- Schema changes go in `supabase/patches/*.sql`: idempotent and additive only. `2026-09-23-tabelas-do-site.sql` (creates the missing site tables, buckets, and adds `profiles` columns) has **not** been applied yet; `2026-09-24-duracao-das-versoes.sql` (adds `music_versions.duration`) has.
- Confirm with the user before applying any SQL to the remote database.

## Styling

Tailwind tokens in `tailwind.config.js`: `navy`, `gold`/`gold-light`, `body` are the current dark landing-page palette; `ink`, `paper`, `clay`, `moss`, `sand` are the older light palette (still used by `Login`, `Method`, etc.). Dark surfaces use `#111817` (page), `#0f2547`/`#0a1a33` with `#24457a` borders (dark-blue panels in the dashboard/admin/studio). Shared utility classes (`btn-primary`, `header-cta`, `section-label`, `container-page`) are in `src/index.css`. Static images (song covers) are in `public/`.

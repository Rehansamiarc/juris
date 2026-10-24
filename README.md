# Juris — law study workspace

A focused portal for Indian law students to study, argue, and qualify. Built with Next.js (App Router, server actions, TypeScript) and Postgres, backed by Supabase.

## What it does

- **Library** — bare Act text and reported judgments, with official text kept visually separate from study commentary. Filter by subject, court, year and principle, plus full-text search.
- **Case briefs** — facts, issue, holding and ratio in one frame, with reasoning you can argue from.
- **Spaced revision** — a conservative SM-2 queue built only from your own briefs and notes; nothing is invented to fill it.
- **Practice sets** — quizzes drawn from the material you have studied, with attempt history kept.
- **Tutor** — questions answered against your library, with citations back to the passage they came from.
- **Scanner** — photograph a printed page or case note and keep it beside the rest of the material for that subject.

## Architecture

The app runs a Node server, not a serverless function. The data layer keeps the synchronous `all` / `one` / `run` interface it had on SQLite: queries run in a worker thread against Postgres via `postgres.js`, and the calling thread blocks on `Atomics.wait` for the reply. That keeps roughly forty call sites — pages, server actions, and lib helpers — unchanged while the rows come from Supabase.

`supabase/schema.sql` is the schema. It mirrors the old SQLite tables and revokes the Data API roles so the tables are only reachable by the application's own connection.

## Running

```
npm ci
npm run build
DATABASE_URL=<postgres connection string> npm start
```

`DATABASE_URL` is required at first query, not at module load, so a missing secret surfaces as a 503 from `/api/health` rather than a blank 500. `AI_API_URL` and friends are optional — the app runs in local extractive mode without them.

## Testing

```
npm run typecheck
npm run smoke
```

`npm run smoke` boots a production build against a throwaway database, seeds it, signs in, and renders every main page. It refuses to run when `SMOKE_DATABASE_URL` matches the app database, since it truncates the target. CI runs it against a Postgres service container on every push.

## Deployment

- **Vercel** — pinned to `syd1` in `vercel.json`, nearest the Supabase project. `DATABASE_URL` is a project secret; scanner uploads will not persist on the ephemeral filesystem.
- **Docker** — `Dockerfile` builds an image for a persistent Node host (Render, Railway, Fly, a VPS) where uploads can mount a volume.

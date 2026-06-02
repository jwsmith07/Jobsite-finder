# Jobsite Finder V1 — Production-Ready Local Setup

This is the cleaned standalone version of the Jobsite Finder V1 frontend.

## What was cleaned

- Removed Replit-only Vite plugins and required `PORT` / `BASE_PATH` variables.
- Converted the app from a Replit workspace artifact into a normal standalone Vite + React app.
- Added a clean `.env.example`.
- Added normal local scripts: `npm run dev`, `npm run build`, `npm run preview`.
- Set local dev server to `http://localhost:5173`.
- Updated Google Maps to use one-finger / normal drag behavior with `gestureHandling: 'greedy'`.
- Kept Supabase, Google Maps, profile pages, dashboards, jobsites, and application logic intact.

## Install

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment setup

Copy `.env.example` to `.env` and fill in your real keys:

```bash
cp .env.example .env
```

Required keys:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
VITE_GOOGLE_MAPS_MAP_ID=YOUR_GOOGLE_MAPS_MAP_ID
# Optional dark mode map ID (preferred when you want a Google Cloud "dark" map style)
# VITE_GOOGLE_MAPS_MAP_ID_DARK=YOUR_GOOGLE_MAPS_DARK_MAP_ID
```

## Supabase Auth settings

```text
Site URL:
http://localhost:5173

Redirect URLs:
http://localhost:5173
http://localhost:5173/**
```

For deployed production later, add your real domain too:

```text
https://yourdomain.com
https://yourdomain.com/**
```

## Google Cloud setup

Enable these APIs:

- Maps JavaScript API
- Directions API
- Geocoding API, optional for later address cleanup

For Google login through Supabase, create OAuth credentials and add this redirect URI:

```text
https://YOUR-PROJECT.supabase.co/auth/v1/callback
```

## Supabase SQL files

SQL helper files are in:

```text
supabase/
```

Run them in order in the Supabase SQL editor if your database is missing profile columns or RLS policies.

## Build for production

```bash
npm run build
npm run preview
```

The production output goes to:

```text
dist/
```

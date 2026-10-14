# 🚀 Deployment Guide & Free-Tier Quota Blueprint

This document explains how to deploy **Veeramani Tracker** to 100% free-tier production infrastructure using **Vercel Hobby** and **Supabase Free**, while outlining real usage boundaries and graceful degradation mechanisms.

---

## 1. Free-Tier Architecture Overview

| Component | Free Provider | Free Tier Allowance | Quota Strategy |
| :--- | :--- | :--- | :--- |
| **Web & API Hosting** | Vercel Hobby | 100 GB bandwidth/mo, 1M Edge middleware invocations | Next.js SSG + Edge caching for public queries |
| **Database & Auth** | Supabase Free | 500 MB PostgreSQL, 50,000 Monthly Active Users | Bounded queries, indexed lookups, compact schema |
| **Media Storage** | Supabase Storage | 1 GB storage, 2 GB bandwidth/mo | Client compression, 2MB size cap, raster re-encoding |
| **Map Raster Tiles** | OpenStreetMap | Community usage (non-bulk) | Browser tile caching, no synthetic load testing on OSM |

---

## 2. Step-by-Step Deployment

### Phase A: Setup Supabase Free Database

1. Sign up or log into [Supabase](https://supabase.com/).
2. Click **New Project**:
   - Name: `veeramani-tracker`
   - Database Password: *(Save securely)*
   - Region: `ap-south-1` (Mumbai) or nearest to South India for lowest latency.
3. Open **SQL Editor** from the left navigation.
4. Copy and paste the contents of:
   - `supabase/migrations/20261014000000_init_veeramani_tracker.sql` (initial schema)
   - `supabase/migrations/20261014000001_refactor_to_tracker_entries.sql` (parody tracker schema refactor)
5. Click **Run** to provision `profiles`, `tracker_entries`, `moderation_actions`, and `rate_limits` tables with Row Level Security, indexes, and triggers.
6. Navigate to **Project Settings -> API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key

### Phase B: Deploy to Vercel

1. Push your code to a private or public GitHub repository.
2. Sign into [Vercel](https://vercel.com/) and click **Add New -> Project**.
3. Import the `veeramani-tracker` repository.
4. In **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
   NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
   ```
5. Click **Deploy**. Vercel will build and launch your application globally on Vercel's Edge Network.

---

## 3. Free-Tier Quotas & Limitations

Never promise infinite free hosting. Here are the hard boundaries:

### 1. Supabase Free Pausing
- **Boundary**: Supabase free projects pause after **7 days of inactivity**.
- **Mitigation**: The app features a built-in **Resilient Demo Fallback**. If the Supabase database is paused or unreachable, the application automatically falls back to the in-memory sample store rather than showing a white screen or crashing.
- **Production Path**: Setting up a free GitHub Action cron ping or upgrading to Supabase Pro ($25/mo) prevents pausing.

### 2. Vercel Serverless Function Concurrency
- **Boundary**: Vercel Hobby limits serverless functions to 10s execution duration and basic concurrency quotas.
- **Mitigation**: All public event list endpoints are equipped with `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` headers. During traffic surges, static assets and public queries are served directly from Vercel's global CDN cache without hitting serverless execution or database queries.

### 3. OpenStreetMap Tile Usage Policy
- **Boundary**: Community OSM servers operate on donated resources. Bulk scraping, tile downloading, or synthetic load tests against OSM tiles violate their policy and will result in IP bans.
- **Mitigation**:
  - OSM tiles are loaded on demand by the visitor's browser only.
  - The load test script (`scripts/load-test.js`) benchmarks only application API endpoints (`/api/events`), never third-party tile servers.
  - The tile URL is abstracted as an environment variable (`NEXT_PUBLIC_MAP_TILE_URL`), allowing instant migration to free tile providers like **MapTiler** (100k free tiles/mo) or **Stadia Maps** if higher tile traffic occurs.

### 4. Media Upload Limits
- **Boundary**: 1 GB free Supabase Storage quota can be depleted by large uncompressed images.
- **Mitigation**: Uploaded images are restricted to JPEG, PNG, and WebP formats with a strict 2MB maximum limit. Unapproved submissions are kept in private buckets and not publicly accessible until approved.

---

## 4. Graceful Degradation Behavior

When quotas or external services are exhausted:
1. **Database Unreachable**: The app displays:  
   *“Connection konjam scene podudhu. Retry pannunga.”* with a working Retry control and gracefully renders sample events.
2. **Rate Limit Triggered**: Returns HTTP 429:  
   *“Submission rate limit reached. Maximum 5 submissions per hour. Please try again later.”*
3. **Map Tiles Slow/Blocked**: The application provides an instant **List View Toggle** allowing visitors to access all event details, directions, and citations even without raster map tiles rendering.

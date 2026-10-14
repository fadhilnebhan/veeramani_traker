# 📋 Known Limitations & Unconfigured Features

This document provides a transparent, honest disclosure of known architectural limitations, third-party boundaries, and features intentionally left unconfigured for the initial release.

---

## 1. Intentionally Excluded Features (By Design)

1. **Crowdsourced Real-Time Location Tracking**:
   - *Status*: Strictly Excluded.
   - *Reason*: In accordance with the project's ethical boundary and privacy policy, the platform will **never** track personal movements, coordinates supplied by strangers, or private whereabouts.

2. **Social Media Scraper Bots**:
   - *Status*: Strictly Excluded.
   - *Reason*: Social networks (X, YouTube, Instagram) frequently contain unverified sightings or private location clues. Scraping is intentionally avoided to ensure every indexed entry is an intentional public announcement verified by a human moderator.

3. **Paid Third-Party Services**:
   - *Status*: Excluded for Free-First MVP.
   - *Details*: Paid services (Google Maps JavaScript API, Mapbox billing, Redis enterprise, external AI summarizers, paid CAPTCHA) were intentionally avoided so the project can be hosted and maintained with $0 recurring fees.

---

## 2. Platform & Free-Tier Limitations

1. **Supabase Free Project Inactivity Sleep**:
   - Free Supabase projects sleep after 7 days without database activity. When sleeping, the application seamlessly activates its built-in sample data store to keep the public experience functional without crashing.

2. **Raster Tiles Rate Limits (OpenStreetMap)**:
   - Community-hosted OSM raster tiles (`tile.openstreetmap.org`) are subject to strict usage limits. They must not be bulk-downloaded or used under high synthetic load. For production deployments with >100,000 monthly visitors, switching `NEXT_PUBLIC_MAP_TILE_URL` to a compliant provider (such as MapTiler or Stadia Maps) is recommended.

3. **In-Memory Rate Limiter in Demo Mode**:
   - In Demo Mode (when Supabase credentials are not provided), rate-limiting uses an in-memory token bucket. In serverless multi-region deployments, database-backed rate limiting (`public.rate_limits` table) should be used.

4. **Image Re-Encoding on Serverless**:
   - Basic file type checking and size caps (2MB) are implemented. Heavy raster re-encoding (e.g. via `sharp` native binaries) requires either Supabase Storage Transformations or dedicated edge compute workers.

5. **Client-Side Map Dynamic Rendering**:
   - Leaflet map components are rendered exclusively on the client (`ssr: false`) to avoid browser API SSR errors (`window is not defined`). The accessible List View is provided as a static, SEO-crawlable alternative.

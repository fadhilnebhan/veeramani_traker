# 🔒 Security & Moderation Architecture

This document details the security posture, access boundaries, Row Level Security (RLS) enforcement, and privacy defense mechanisms of **Veeramani Tracker**.

---

## 1. Threat Model & Privacy Principles

Because this product indexes announced public appearances, its primary threat model concerns:
1. **Doxxing and Surveillance Prevention**: Preventing malicious users from attempting to submit private residences, hotel locations, personal vehicles, or live coordinates.
2. **Unauthorized Publishing**: Ensuring that no user can bypass review or publish submissions directly into the live map.
3. **Server-Side Request Forgery (SSRF)**: Preventing malicious URLs in source citations from probing internal network infrastructure.
4. **Data Leakage**: Ensuring submitters' email addresses, internal UUIDs, and credentials are never exposed on public pages.

---

## 2. Row Level Security (RLS) Policies

All PostgreSQL tables have Row Level Security enabled in `supabase/migrations/20261014000000_init_veeramani_tracker.sql`:

### `public.tracker_entries`
- **SELECT Policy (`Public can view approved active parody signals`)**:
  - Unauthenticated visitors can only view entries where `status = 'approved'`.
  - Authenticated contributors can view their own transmissions regardless of status (`author_id = auth.uid()`).
  - Active moderators can view all records across all queues.
- **INSERT Policy (`Users can insert pending parody submissions`)**:
  - Authenticated users can insert entries strictly with `status = 'pending'`, and both `approved_by` and `approved_at` must be `NULL`.
- **UPDATE Policy (`Moderators can update any entry`)**:
  - Only accounts passing the `is_moderator()` security-definer function can modify status, approval timestamps, or moderation reasons.

### `public.profiles`
- **SELECT Policy**: Display names are only exposed if `show_public_attribution = true`, or if the profile belongs to the caller or a moderator.
- **UPDATE Policy**: Users can only update their own `display_name` and `show_public_attribution`. **Self-promotion to `moderator` or `admin` is blocked at the database RLS level**:
  ```sql
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  ```

### `public.moderation_actions`
- Read and write access is restricted solely to accounts with `role IN ('moderator', 'admin')`. Every administrative decision creates an immutable audit row.

---

## 3. Server-Side Secrets & Client Boundary

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Exposed to the client browser. Can only perform actions permitted by PostgreSQL RLS policies.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Kept **exclusively on the server** in Next.js Route Handlers. Never bundled into client JavaScript.
- **Zero Secrets in Git**: `.env.example` provides parameter names with dummy placeholders; `.gitignore` strictly ignores `.env*` files.

---

## 4. Input Validation & SSRF Prevention

All inputs submitted to `POST /api/events` and `PATCH /api/admin/events/[id]` are parsed through Zod:
1. **Forbidden Keyword Filter**: Submissions containing keywords such as *"residence"*, *"apartment"*, *"flat no"*, *"hotel room"*, *"stalking"*, or *"chasing"* are immediately rejected.
2. **Geographic Boundaries**: Latitudes must fall between `8.0` and `14.5`, and longitudes between `76.0` and `81.0` (Tamil Nadu / South India).
3. **SSRF Defense**: The `source_url` is validated against a strict regex rejecting `localhost`, `127.0.0.1`, `0.0.0.0`, and internal RFC-1918 subnets (`10.x`, `192.168.x`, `172.16-31.x`).
4. **XSS Sanitization**: Text fields are sanitized with character replacement (`<`, `>`, `"`, `'`) before storage.

---

## 5. Image Upload Security

For promotional event banners:
- **Allowed Formats**: JPEG, PNG, WebP only.
- **Size Limit**: Maximum 2 MB per file.
- **Private Storage**: Unmoderated uploads are stored in private Supabase Storage buckets.
- **Metadata Stripping**: Image ingestion pipelines strip EXIF and GPS geolocation metadata to eliminate unintended privacy leakage.
- **No Personal Sightings**: User-uploaded selfies or paparazzi photographs are rejected.

---

## 6. Abuse Mitigation & Rate Limiting

- Submission endpoints are protected by database-backed rate limits: **maximum 5 submissions per hour per IP/user**.
- Submissions exceeding this threshold are blocked with HTTP 429 (`Too Many Requests`).

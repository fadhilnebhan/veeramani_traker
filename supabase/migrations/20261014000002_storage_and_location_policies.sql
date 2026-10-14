-- Migration: Storage Bucket & Location Policies
-- Creates tracker-media storage bucket with RLS policies and adds support for simple report fields

-- 1. EXTEND TRACKER ENTRIES TABLE WITH SIMPLIFIED REPORT FIELDS
ALTER TABLE public.tracker_entries
    ADD COLUMN IF NOT EXISTS note TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS venue_name TEXT,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS area_label TEXT;

-- 2. CREATE STORAGE BUCKET FOR TRACKER MEDIA (5MB LIMIT, JPEG/PNG/WEBP ONLY)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tracker-media',
    'tracker-media',
    true,
    5242880, -- 5 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. STORAGE ROW LEVEL SECURITY POLICIES
-- Anyone can view media files from tracker-media
CREATE POLICY "Public Read Access for Tracker Media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'tracker-media');

-- Authenticated or anonymous submission flow can upload sanitized signals
CREATE POLICY "Scouts Can Upload Media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'tracker-media'
        AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp')
    );

-- Only moderators or admins can delete media
CREATE POLICY "Moderators Can Delete Tracker Media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'tracker-media'
        AND (public.is_moderator() OR auth.role() = 'service_role')
    );

-- 4. ALLOW PUBLIC/ANONYMOUS TRANSMISSIONS OF FICTIONAL PARODY SIGNALS
CREATE POLICY "Allow public submissions of verified parody signals"
    ON public.tracker_entries FOR INSERT
    WITH CHECK (
        is_fictional_confirmed = TRUE
        AND latitude >= 8.0 AND latitude <= 14.5
        AND longitude >= 76.0 AND longitude <= 81.0
    );

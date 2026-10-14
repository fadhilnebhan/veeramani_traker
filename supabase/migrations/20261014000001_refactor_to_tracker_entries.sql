-- Migration: Refactor to Parody Tracker Entries
-- Replaces event-specific model with a parody tracker model while preserving data safety

-- 1. CREATE TRACKER ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.tracker_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 120),
    slug TEXT UNIQUE,
    description TEXT NOT NULL CHECK (char_length(description) >= 15 AND char_length(description) <= 1500),
    category TEXT NOT NULL CHECK (category IN (
        'cinematic_echo',
        'tea_shop_myth',
        'folklore_rumor',
        'viral_meme',
        'pop_culture_lore',
        'parody_frequency'
    )),
    district TEXT NOT NULL CHECK (char_length(district) >= 2 AND char_length(district) <= 60),
    landmark_name TEXT NOT NULL CHECK (char_length(landmark_name) >= 3 AND char_length(landmark_name) <= 120),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= 8.0 AND latitude <= 14.5),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= 76.0 AND longitude <= 81.0),
    signal_strength INT DEFAULT 85 CHECK (signal_strength >= 10 AND signal_strength <= 100),
    frequency_mhz NUMERIC DEFAULT 104.2,
    is_fictional_confirmed BOOLEAN DEFAULT TRUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
    moderation_reason TEXT,
    media_path TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. SAFE DATA MIGRATION FROM OLD EVENTS TABLE (IF EXISTS)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        INSERT INTO public.tracker_entries (
            id, author_id, title, slug, description, category, district, landmark_name,
            latitude, longitude, signal_strength, frequency_mhz, is_fictional_confirmed,
            status, moderation_reason, media_path, approved_by, approved_at, created_at, updated_at
        )
        SELECT
            id,
            submitted_by,
            title,
            slug,
            description,
            'parody_frequency',
            city,
            venue_name,
            latitude,
            longitude,
            85,
            104.2,
            TRUE,
            status,
            moderation_reason,
            promotional_image_path,
            approved_by,
            approved_at,
            created_at,
            updated_at
        FROM public.events
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. INDEXES FOR TRACKER ENTRIES
CREATE INDEX IF NOT EXISTS idx_tracker_entries_status ON public.tracker_entries(status);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_category ON public.tracker_entries(category);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_district ON public.tracker_entries(district);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_coords ON public.tracker_entries(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tracker_entries_author ON public.tracker_entries(author_id);

-- 4. UPDATE MODERATION ACTIONS TO REFERENCE TRACKER ENTRIES
ALTER TABLE IF EXISTS public.moderation_actions 
    ADD COLUMN IF NOT EXISTS entry_id UUID REFERENCES public.tracker_entries(id) ON DELETE CASCADE;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR TRACKER ENTRIES
ALTER TABLE public.tracker_entries ENABLE ROW LEVEL SECURITY;

-- Public can view approved parody tracker signals
CREATE POLICY "Public can view approved tracker signals"
    ON public.tracker_entries FOR SELECT
    USING (
        status = 'approved'
        OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
        OR public.is_moderator()
    );

-- Authenticated users can insert pending parody signals with mandatory fictional flag
CREATE POLICY "Users can insert pending parody signals"
    ON public.tracker_entries FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND author_id = auth.uid()
        AND status = 'pending'
        AND is_fictional_confirmed = TRUE
        AND approved_by IS NULL
        AND approved_at IS NULL
    );

-- Only moderators can update entries (approvals, rejections, removals)
CREATE POLICY "Moderators can update tracker entries"
    ON public.tracker_entries FOR UPDATE
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

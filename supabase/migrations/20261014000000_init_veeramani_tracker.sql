-- Veeramani Tracker Initial Schema Migration
-- Designed for Supabase PostgreSQL with strict RLS and role boundaries

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    show_public_attribution BOOLEAN DEFAULT FALSE NOT NULL,
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'moderator', 'admin')),
    account_status TEXT DEFAULT 'active' NOT NULL CHECK (account_status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 120),
    slug TEXT UNIQUE,
    description TEXT NOT NULL CHECK (char_length(description) >= 15 AND char_length(description) <= 1500),
    category TEXT NOT NULL CHECK (category IN (
        'cultural_festival',
        'public_meeting',
        'temple_festival',
        'audio_launch',
        'press_conference',
        'charity_drive',
        'book_fair',
        'college_culturals',
        'sports_inauguration',
        'other_public'
    )),
    city TEXT NOT NULL CHECK (char_length(city) >= 2 AND char_length(city) <= 60),
    venue_name TEXT NOT NULL CHECK (char_length(venue_name) >= 3 AND char_length(venue_name) <= 120),
    public_address TEXT CHECK (public_address IS NULL OR char_length(public_address) <= 250),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= 8.0 AND latitude <= 14.5),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= 76.0 AND longitude <= 81.0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ CHECK (ends_at IS NULL OR ends_at >= starts_at),
    source_url TEXT NOT NULL CHECK (source_url ~* '^https?://[a-zA-Z0-9.-]+'),
    source_name TEXT NOT NULL CHECK (char_length(source_name) >= 2 AND char_length(source_name) <= 80),
    promotional_image_path TEXT,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed', 'expired')),
    moderation_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ
);

-- 3. MODERATION ACTIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'remove', 'expire', 'edit')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. DATABASE-BACKED RATE LIMITS TABLE
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_coords ON public.events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_events_submitted_by ON public.events(submitted_by);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window ON public.rate_limits(key, window_start);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('moderator', 'admin') AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are visible if public attribution is consented"
    ON public.profiles FOR SELECT
    USING (show_public_attribution = true OR id = auth.uid() OR public.is_moderator());

CREATE POLICY "Users can update their own profile display name and attribution"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Events Policies
-- 1. Public can view approved and non-expired events
CREATE POLICY "Public can view approved active events"
    ON public.events FOR SELECT
    USING (
        (status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()))
        OR (auth.uid() IS NOT NULL AND submitted_by = auth.uid())
        OR public.is_moderator()
    );

-- 2. Authenticated users can insert pending submissions only
CREATE POLICY "Users can insert pending event submissions"
    ON public.events FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND submitted_by = auth.uid()
        AND status = 'pending'
        AND approved_by IS NULL
        AND approved_at IS NULL
    );

-- 3. Only moderators can update events (for approval, rejection, or removal)
CREATE POLICY "Moderators can update any event"
    ON public.events FOR UPDATE
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

-- Moderation Actions Policies
CREATE POLICY "Moderators can read moderation audit logs"
    ON public.moderation_actions FOR SELECT
    USING (public.is_moderator());

CREATE POLICY "Moderators can insert moderation actions"
    ON public.moderation_actions FOR INSERT
    WITH CHECK (public.is_moderator() AND moderator_id = auth.uid());

-- Rate Limits Policies
CREATE POLICY "System can manage rate limits"
    ON public.rate_limits FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. PROFILE CREATION TRIGGER ON AUTH.USERS INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, show_public_attribution, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        false,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

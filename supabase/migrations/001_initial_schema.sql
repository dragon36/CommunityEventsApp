-- =============================================================================
-- COMMUNITY EVENTS APP - INITIAL SCHEMA
-- Migration: 001_initial_schema.sql
-- =============================================================================
-- This migration creates the core tables for the Community Events app
-- when using Supabase as the backend.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- PROFILES TABLE (Users)
-- =============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    bio TEXT,
    location JSONB, -- { city, state, country, coordinates: { lat, lng }, geohash }
    notification_settings JSONB DEFAULT '{
        "event_approved": true,
        "event_rejected": true,
        "event_reminder": true,
        "new_events_nearby": true,
        "admin_announcements": true
    }'::jsonb,
    privacy_settings JSONB DEFAULT '{
        "profile_visibility": "public",
        "show_email": false,
        "show_location": false,
        "show_attending_events": true
    }'::jsonb,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    follower_ids UUID[] DEFAULT '{}',
    following_ids UUID[] DEFAULT '{}',
    saved_event_ids UUID[] DEFAULT '{}',
    interested_categories TEXT[] DEFAULT '{}',
    fcm_token TEXT,
    google_calendar_tokens JSONB, -- { access_token, refresh_token, expiry_date }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    events_created UUID[] DEFAULT '{}',
    events_attending UUID[] DEFAULT '{}'
);

-- Indexes for profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
-- GIN indexes for array columns
CREATE INDEX idx_profiles_follower_ids ON profiles USING GIN (follower_ids);
CREATE INDEX idx_profiles_following_ids ON profiles USING GIN (following_ids);
CREATE INDEX idx_profiles_saved_event_ids ON profiles USING GIN (saved_event_ids);
CREATE INDEX idx_profiles_events_created ON profiles USING GIN (events_created);
CREATE INDEX idx_profiles_events_attending ON profiles USING GIN (events_attending);

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (
        privacy_settings->>'profile_visibility' = 'public'
        OR auth.uid() = id
        OR auth.uid() = ANY(follower_ids)
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- VENUES TABLE
-- =============================================================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326),
    geohash TEXT,
    description TEXT,
    capacity INTEGER,
    amenities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    website TEXT,
    phone TEXT,
    email TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed'))
);

CREATE INDEX idx_venues_city_state ON venues(city, state);
CREATE INDEX idx_venues_geohash ON venues(geohash);
CREATE INDEX idx_venues_coordinates ON venues USING GIST (coordinates);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_created_by ON venues(created_by);

CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active venues" ON venues
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create venues" ON venues
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their venues" ON venues
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all venues" ON venues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- EVENTS TABLE
-- =============================================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('parade', 'trick_or_treat', 'special_event')),
    location JSONB NOT NULL, -- { address, city, state, country, coordinates, geohash, venue_name, venue_id }
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    co_organizer_ids UUID[] DEFAULT '{}',
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'draft', 'published', 'completed', 'removed')),
    attendee_ids UUID[] DEFAULT '{}',
    max_attendees INTEGER,
    cover_image_urls TEXT[] DEFAULT '{}',
    cover_image_original TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    google_calendar_event_id TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    reminders_sent TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    moderation_flagged BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    images TEXT[] DEFAULT '{}',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    attendees_count INTEGER DEFAULT 0
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_is_public ON events(is_public);
-- GIN indexes for array columns
CREATE INDEX idx_events_tags ON events USING GIN (tags);
CREATE INDEX idx_events_co_organizer_ids ON events USING GIN (co_organizer_ids);
CREATE INDEX idx_events_attendee_ids ON events USING GIN (attendee_ids);
CREATE INDEX idx_events_cover_image_urls ON events USING GIN (cover_image_urls);
CREATE INDEX idx_events_gallery_images ON events USING GIN (gallery_images);
CREATE INDEX idx_events_images ON events USING GIN (images);
CREATE INDEX idx_events_location_geohash ON events((location->>'geohash'));
-- Composite indexes
CREATE INDEX idx_events_status_start_date ON events(status, start_date);
CREATE INDEX idx_events_created_by_status ON events(created_by, status);
CREATE INDEX idx_events_approved_status ON events(status, start_date) WHERE status = 'approved';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view approved public events" ON events
    FOR SELECT USING (
        status = 'approved' AND visibility = 'public'
    );

CREATE POLICY "Users can view unlisted events they have link to" ON events
    FOR SELECT USING (
        status = 'approved' AND visibility = 'unlisted'
    );

CREATE POLICY "Organizers can view their own events" ON events
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Co-organizers can view events" ON events
    FOR SELECT USING (auth.uid() = ANY(co_organizer_ids));

CREATE POLICY "Attendees can view events they're attending" ON events
    FOR SELECT USING (auth.uid() = ANY(attendee_ids));

CREATE POLICY "Authenticated users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update their events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Co-organizers can update events" ON events
    FOR UPDATE USING (auth.uid() = ANY(co_organizer_ids));

CREATE POLICY "Organizers can delete their events" ON events
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update any event" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete any event" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- EVENT ATTENDEES TABLE (RSVPs)
-- =============================================================================
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('going', 'interested', 'not_going')),
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendees for events they can see" ON event_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_attendees.event_id
            AND (
                events.status = 'approved' AND events.visibility = 'public'
                OR events.status = 'approved' AND events.visibility = 'unlisted'
                OR events.created_by = auth.uid()
                OR auth.uid() = ANY(events.co_organizer_ids)
                OR auth.uid() = ANY(events.attendee_ids)
            )
        )
    );

CREATE POLICY "Users can manage their own RSVPs" ON event_attendees
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view all attendees" ON event_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_attendees.event_id
            AND (events.created_by = auth.uid() OR auth.uid() = ANY(events.co_organizer_ids))
        )
    );

-- =============================================================================
-- EVENT COMMENTS TABLE
-- =============================================================================
CREATE TABLE event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    hidden BOOLEAN DEFAULT FALSE,
    moderation_flagged BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT
);

CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_user_id ON event_comments(user_id);
CREATE INDEX idx_event_comments_created_at ON event_comments(created_at DESC);
CREATE INDEX idx_event_comments_hidden ON event_comments(hidden);

CREATE TRIGGER update_event_comments_updated_at
    BEFORE UPDATE ON event_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for events they can see" ON event_comments
    FOR SELECT USING (
        NOT hidden
        AND EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_comments.event_id
            AND (
                events.status = 'approved' AND events.visibility = 'public'
                OR events.status = 'approved' AND events.visibility = 'unlisted'
                OR events.created_by = auth.uid()
                OR auth.uid() = ANY(events.co_organizer_ids)
                OR auth.uid() = ANY(events.attendee_ids)
            )
        )
    );

CREATE POLICY "Users can create comments on events they can see" ON event_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_comments.event_id
            AND (
                events.status = 'approved' AND events.visibility = 'public'
                OR events.status = 'approved' AND events.visibility = 'unlisted'
                OR events.created_by = auth.uid()
                OR auth.uid() = ANY(events.co_organizer_ids)
                OR auth.uid() = ANY(events.attendee_ids)
            )
        )
    );

CREATE POLICY "Users can update their own comments" ON event_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON event_comments
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Moderators can hide any comment" ON event_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- =============================================================================
-- FRIENDS TABLE
-- =============================================================================
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_friends_user_friend ON friends(user_id, friend_id);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() != friend_id);

CREATE POLICY "Users can update friend requests they received" ON friends
    FOR UPDATE USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =============================================================================
-- SAVED EVENTS TABLE
-- =============================================================================
CREATE TABLE saved_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_saved_events_user_id ON saved_events(user_id);
CREATE INDEX idx_saved_events_event_id ON saved_events(event_id);

ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved events" ON saved_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save events" ON saved_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave events" ON saved_events
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'new_event', 'event_reminder', 'rsvp', 'rsvp_update', 'comment',
        'friend_request', 'friend_accepted', 'event_update', 'event_cancelled',
        'moderation', 'report_outcome', 'weekly_digest', 'system'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- REPORTS TABLE
-- =============================================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type TEXT NOT NULL CHECK (target_type IN ('event', 'comment', 'user', 'venue')),
    target_id UUID NOT NULL,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    flagged_content TEXT[] DEFAULT '{}',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Moderators can update reports" ON reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- =============================================================================
-- ANALYTICS EVENTS TABLE
-- =============================================================================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- SEARCH INDEX TABLE
-- =============================================================================
CREATE TABLE search_index_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    city TEXT,
    state TEXT,
    country TEXT,
    geohash TEXT,
    coordinates GEOGRAPHY(POINT, 4326),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attendee_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_text TSVECTOR
);

CREATE INDEX idx_search_events_event_id ON search_index_events(event_id);
CREATE INDEX idx_search_events_city_state ON search_index_events(city, state);
CREATE INDEX idx_search_events_start_date ON search_index_events(start_date);
CREATE INDEX idx_search_events_organizer_id ON search_index_events(organizer_id);
CREATE INDEX idx_search_events_geohash ON search_index_events(geohash);
CREATE INDEX idx_search_events_search_text ON search_index_events USING GIN (search_text);

CREATE TRIGGER update_search_index_events_updated_at
    BEFORE UPDATE ON search_index_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE search_index_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can search approved events" ON search_index_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = search_index_events.event_id
            AND events.status = 'approved'
            AND events.visibility = 'public'
        )
    );

CREATE POLICY "System can manage search index" ON search_index_events
    FOR ALL USING (TRUE);

-- =============================================================================
-- DAILY METRICS TABLE
-- =============================================================================
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    new_users INTEGER DEFAULT 0,
    new_events INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    rsvps INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    categories JSONB DEFAULT '{}',
    top_cities JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);

CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view daily metrics" ON daily_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can manage daily metrics" ON daily_metrics
    FOR ALL USING (TRUE);

-- =============================================================================
-- ADMIN STATS TABLE
-- =============================================================================
CREATE TABLE admin_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    pending_events INTEGER DEFAULT 0,
    approved_events INTEGER DEFAULT 0,
    rejected_events INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    events_today INTEGER DEFAULT 0,
    events_this_week INTEGER DEFAULT 0,
    events_this_month INTEGER DEFAULT 0,
    reports_pending INTEGER DEFAULT 0,
    reports_resolved INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_admin_stats_updated_at
    BEFORE UPDATE ON admin_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE admin_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin stats" ON admin_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can update admin stats" ON admin_stats
    FOR ALL USING (TRUE);

-- =============================================================================
-- APP HEALTH TABLE
-- =============================================================================
CREATE TABLE app_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'down', 'operational')),
    firestore_status TEXT DEFAULT 'up' CHECK (firestore_status IN ('up', 'down', 'operational', 'degraded', 'outage')),
    auth_status TEXT DEFAULT 'up' CHECK (auth_status IN ('up', 'down', 'operational', 'degraded', 'outage')),
    storage_status TEXT DEFAULT 'up' CHECK (storage_status IN ('up', 'down', 'operational', 'degraded', 'outage')),
    functions_status TEXT DEFAULT 'up' CHECK (functions_status IN ('up', 'down', 'operational', 'degraded', 'outage')),
    latency_p50 NUMERIC DEFAULT 0,
    latency_p95 NUMERIC DEFAULT 0,
    latency_p99 NUMERIC DEFAULT 0,
    error_rate NUMERIC DEFAULT 0,
    uptime NUMERIC DEFAULT 100,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    last_check TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_app_health_updated_at
    BEFORE UPDATE ON app_health
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE app_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view app health" ON app_health
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can update app health" ON app_health
    FOR ALL USING (TRUE);

-- =============================================================================
-- ADMIN ACTIONS TABLE
-- =============================================================================
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_name TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'approve_event', 'reject_event', 'delete_event',
        'suspend_user', 'activate_user', 'change_role', 'reset_password',
        'enable_user', 'disable_user', 'create_event'
    )),
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'event')),
    target_id UUID NOT NULL,
    target_name TEXT,
    reason TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_timestamp ON admin_actions(timestamp DESC);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert admin actions" ON admin_actions
    FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- =============================================================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    new_events_nearby BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    event_updates BOOLEAN DEFAULT TRUE,
    friend_activity BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search_text for search_index_events
CREATE OR REPLACE FUNCTION update_search_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_text :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_index_events_search_text
    BEFORE INSERT OR UPDATE ON search_index_events
    FOR EACH ROW
    EXECUTE FUNCTION update_search_text();

-- Function to generate geohash from coordinates
CREATE OR REPLACE FUNCTION generate_geohash(lat DOUBLE PRECISION, lon DOUBLE PRECISION, precision INTEGER DEFAULT 7)
RETURNS TEXT AS $$
DECLARE
    base32 CONSTANT TEXT := '0123456789bcdefghjkmnpqrstuvwxyz';
    lat_min DOUBLE PRECISION := -90.0;
    lat_max DOUBLE PRECISION := 90.0;
    lon_min DOUBLE PRECISION := -180.0;
    lon_max DOUBLE PRECISION := 180.0;
    geohash TEXT := '';
    bit INTEGER := 0;
    ch INTEGER := 0;
    even BOOLEAN := TRUE;
    mid DOUBLE PRECISION;
BEGIN
    WHILE LENGTH(geohash) < precision LOOP
        IF even THEN
            mid := (lon_min + lon_max) / 2;
            IF lon > mid THEN
                ch := ch * 2 + 1;
                lon_min := mid;
            ELSE
                ch := ch * 2;
                lon_max := mid;
            END IF;
        ELSE
            mid := (lat_min + lat_max) / 2;
            IF lat > mid THEN
                ch := ch * 2 + 1;
                lat_min := mid;
            ELSE
                ch := ch * 2;
                lat_max := mid;
            END IF;
        END IF;
        even := NOT even;
        bit := bit + 1;
        IF bit = 5 THEN
            geohash := geohash || SUBSTRING(base32 FROM ch + 1 FOR 1);
            bit := 0;
            ch := 0;
        END IF;
    END LOOP;
    RETURN geohash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, display_name, created_at, updated_at, last_login_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to update events table when event is created/updated in search_index_events
CREATE OR REPLACE FUNCTION sync_event_to_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM search_index_events WHERE event_id = OLD.id;
        RETURN OLD;
    END IF;

    INSERT INTO search_index_events (
        event_id, title, description, category, tags,
        city, state, country, geohash, coordinates,
        start_date, end_date, organizer_id, attendee_count,
        created_at, updated_at
    ) VALUES (
        NEW.id, NEW.title, NEW.description, NEW.category, NEW.tags,
        NEW.location->>'city', NEW.location->>'state', NEW.location->>'country',
        NEW.location->>'geohash',
        CASE
            WHEN NEW.location->'coordinates' IS NOT NULL THEN
                ST_SetSRID(ST_MakePoint(
                    (NEW.location->'coordinates'->>'longitude')::DOUBLE PRECISION,
                    (NEW.location->'coordinates'->>'latitude')::DOUBLE PRECISION
                ), 4326)::GEOGRAPHY
            ELSE NULL
        END,
        NEW.start_date, NEW.end_date, NEW.created_by, NEW.attendees_count,
        NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (event_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        geohash = EXCLUDED.geohash,
        coordinates = EXCLUDED.coordinates,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        organizer_id = EXCLUDED.organizer_id,
        attendee_count = EXCLUDED.attendee_count,
        updated_at = EXCLUDED.updated_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_event_to_search_index_trigger
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION sync_event_to_search_index();

-- Function to update attendees_count on events when RSVP changes
CREATE OR REPLACE FUNCTION update_event_attendees_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE events
        SET attendees_count = (
            SELECT COUNT(*) FROM event_attendees
            WHERE event_id = OLD.event_id AND status = 'going'
        ),
        attendee_ids = (
            SELECT ARRAY_AGG(user_id) FROM event_attendees
            WHERE event_id = OLD.event_id AND status = 'going'
        )
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;

    UPDATE events
    SET attendees_count = (
        SELECT COUNT(*) FROM event_attendees
        WHERE event_id = NEW.event_id AND status = 'going'
    ),
    attendee_ids = (
        SELECT ARRAY_AGG(user_id) FROM event_attendees
        WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_attendees_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_event_attendees_count();

-- Function to update user's events_attending array when RSVP changes
CREATE OR REPLACE FUNCTION update_user_events_attending()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET events_attending = (
            SELECT ARRAY_AGG(event_id) FROM event_attendees
            WHERE user_id = OLD.user_id AND status = 'going'
        )
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;

    UPDATE profiles
    SET events_attending = (
        SELECT ARRAY_AGG(event_id) FROM event_attendees
        WHERE user_id = NEW.user_id AND status = 'going'
    )
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_events_attending_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_user_events_attending();

-- Function to update user's events_created array when event is created/deleted
CREATE OR REPLACE FUNCTION update_user_events_created()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE profiles
        SET events_created = (
            SELECT ARRAY_AGG(id) FROM events
            WHERE created_by = OLD.created_by
        )
        WHERE id = OLD.created_by;
        RETURN OLD;
    END IF;

    UPDATE profiles
    SET events_created = (
        SELECT ARRAY_AGG(id) FROM events
        WHERE created_by = NEW.created_by
    )
    WHERE id = NEW.created_by;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_events_created_trigger
    AFTER INSERT OR DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_events_created();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default categories
INSERT INTO categories (name, slug, icon, color, description, "order") VALUES
    ('Music', 'music', 'music', '#E91E63', 'Concerts, festivals, and live music events', 1),
    ('Food & Drink', 'food', 'restaurant', '#FF9800', 'Food festivals, tastings, and culinary events', 2),
    ('Arts & Culture', 'arts', 'palette', '#9C27B0', 'Art exhibitions, theater, and cultural events', 3),
    ('Sports & Fitness', 'sports', 'fitness_center', '#4CAF50', 'Sports games, fitness classes, and outdoor activities', 4),
    ('Technology', 'tech', 'computer', '#2196F3', 'Tech meetups, hackathons, and conferences', 5),
    ('Business', 'business', 'business', '#607D8B', 'Networking, workshops, and business events', 6),
    ('Education', 'education', 'school', '#3F51B5', 'Classes, workshops, and educational events', 7),
    ('Health & Wellness', 'health', 'spa', '#00BCD4', 'Wellness retreats, health fairs, and fitness', 8),
    ('Community', 'community', 'groups', '#795548', 'Local community gatherings and volunteer events', 9),
    ('Nightlife', 'nightlife', 'nightlife', '#673AB7', 'Parties, club events, and nightlife', 10),
    ('Outdoor', 'outdoor', 'park', '#8BC34A', 'Outdoor adventures, hiking, and nature events', 11),
    ('Family', 'family', 'family_restroom', '#FF5722', 'Family-friendly events and activities', 12),
    ('Charity', 'charity', 'volunteer', '#E91E63', 'Fundraisers, charity events, and volunteering', 13),
    ('Other', 'other', 'event', '#9E9E9E', 'Miscellaneous events', 14)
ON CONFLICT (slug) DO NOTHING;

-- Insert initial admin stats row
INSERT INTO admin_stats (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- Insert initial app health row
INSERT INTO app_health (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;
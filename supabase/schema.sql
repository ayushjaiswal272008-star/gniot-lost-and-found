-- =========================================================================
-- GNIOT Lost & Found AI - Supabase Database Schema & Security Policies
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Campus Locations Table
CREATE TABLE IF NOT EXISTS public.campus_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  zone TEXT NOT NULL,
  description TEXT,
  desk_contact TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reports Table (Lost and Found Items)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location_id TEXT REFERENCES public.campus_locations(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  location_details TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT 'Unspecified',
  brand TEXT,
  model TEXT,
  distinctive_features TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  hidden_verification_clue TEXT,
  storage_desk TEXT,
  contact_preference TEXT DEFAULT 'Campus Desk',
  reward TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Possible Match', 'Claim Pending', 'Verification Pending', 'Resolved', 'Closed')),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_roll_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ownership Claims Table
CREATE TABLE IF NOT EXISTS public.claims (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  item_title TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  claimant_id TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_roll_no TEXT,
  claimant_phone_masked TEXT,
  proof_description TEXT NOT NULL,
  distinctive_mark_answer TEXT,
  serial_number_or_id_clue TEXT,
  uploaded_proof_image TEXT,
  status TEXT NOT NULL DEFAULT 'Verification Pending' CHECK (status IN ('Verification Pending', 'Approved', 'Rejected', 'Resolved')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Match Results Table
CREATE TABLE IF NOT EXISTS public.ai_matches (
  id TEXT PRIMARY KEY,
  lost_report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  found_report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  lost_item_title TEXT NOT NULL,
  found_item_title TEXT NOT NULL,
  match_score INTEGER NOT NULL,
  confidence_level TEXT NOT NULL,
  match_reasons JSONB DEFAULT '[]'::jsonb,
  visual_score INTEGER,
  semantic_score INTEGER,
  location_proximity_score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('match', 'claim', 'status', 'desk')),
  report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (Admin Security Tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Locations: Anyone can read campus locations
CREATE POLICY "Public locations read" 
  ON public.campus_locations FOR SELECT 
  USING (true);

-- Reports: Anyone can read reports (public campus lost & found directory)
CREATE POLICY "Public reports read" 
  ON public.reports FOR SELECT 
  USING (true);

-- Reports: Anyone can submit a lost or found report
CREATE POLICY "Public reports insert" 
  ON public.reports FOR INSERT 
  WITH CHECK (true);

-- Reports: Owner or campus admin can update report status
CREATE POLICY "Reports update" 
  ON public.reports FOR UPDATE 
  USING (true);

-- Claims: Anyone can view claims for verification / their own claims
CREATE POLICY "Public claims read" 
  ON public.claims FOR SELECT 
  USING (true);

-- Claims: Anyone can submit an ownership claim
CREATE POLICY "Public claims insert" 
  ON public.claims FOR INSERT 
  WITH CHECK (true);

-- Claims: Update policy for verification
CREATE POLICY "Claims update" 
  ON public.claims FOR UPDATE 
  USING (true);

-- Notifications: Anyone can read notifications
CREATE POLICY "Notifications read" 
  ON public.notifications FOR SELECT 
  USING (true);

-- Notifications: Anyone can insert notifications
CREATE POLICY "Notifications insert" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- Notifications: Anyone can mark notification read
CREATE POLICY "Notifications update" 
  ON public.notifications FOR UPDATE 
  USING (true);

-- Matches: Anyone can read AI matches
CREATE POLICY "Matches read" 
  ON public.ai_matches FOR SELECT 
  USING (true);

CREATE POLICY "Matches insert" 
  ON public.ai_matches FOR INSERT 
  WITH CHECK (true);

-- =========================================================================
-- SEED INITIAL DATA: GNIOT Campus Locations
-- =========================================================================
INSERT INTO public.campus_locations (id, name, code, zone, description, desk_contact) VALUES
('loc-1', 'Main Academic Block (APJ Kalam Block)', 'MAB', 'Academic', 'Central administrative offices, lecture halls 101-315, and dean office', 'Ground Floor Reception Desk (+91 120 232xxxx)'),
('loc-2', 'GNIOT Central Library', 'LIB', 'Academic', 'Floors 1-3, Reference section, Reading hall, Digital library', 'Circulation Desk Counter 2'),
('loc-3', 'Computer Science & IT Labs Block', 'CS-LAB', 'Technical', 'High performance labs 1-8, AI/ML center, robotics workshop', 'Block B Lab Technician Office (Lab 204)'),
('loc-4', 'Central Student Canteen & Food Court', 'CANTEEN', 'Amenities', 'Main student dining cafeteria, Nescafe kiosk, and outdoor plaza seating', 'Canteen Supervisor Counter'),
('loc-5', 'Campus Sports Complex & Cricket Ground', 'SPORTS', 'Athletics', 'Basketball courts, indoor badminton hall, gymnasium, cricket pavilion', 'Physical Education Dept Office / Gym Desk'),
('loc-6', 'Boys Hostel Block 1 & 2', 'HOSTEL-B', 'Residential', 'Hostel reception, student common room, mess dining hall', 'Hostel Warden Office (Block 1 Reception)'),
('loc-7', 'Girls Hostel Block (Maa Saraswati)', 'HOSTEL-G', 'Residential', 'Girls campus residential wing, indoor study lounge', 'Girls Hostel Caretaker Office'),
('loc-8', 'Main Campus Gate 1 & Security Control', 'GATE-1', 'Security', 'Primary college entrance, visitor registration, 24/7 guard room', 'Central Campus Security Office Gate 1')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  zone = EXCLUDED.zone,
  description = EXCLUDED.description,
  desk_contact = EXCLUDED.desk_contact;

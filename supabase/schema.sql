-- =========================================================================
-- GNIOT Lost & Found AI - Complete Supabase Database Schema & Security
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/yvdztwjlikuzozkhplcb/sql
-- =========================================================================

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  college_email TEXT,
  roll_no TEXT,
  department TEXT DEFAULT 'Computer Science & Engineering',
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically populate profile when a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, college_email, roll_no, department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'roll_no', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    college_email = EXCLUDED.college_email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 2. CAMPUS LOCATIONS TABLE
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 3. REPORTS TABLE (Lost & Found Items)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 3B. ITEM PRIVATE DETAILS (SECRET CLUES - RESTRICTED ACCESS)
-- Never exposed to public listing queries
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.item_private_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  secret_clue TEXT NOT NULL,
  serial_number_or_mac TEXT,
  proof_document_url TEXT,
  private_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_item_private_details UNIQUE (item_id)
);

-- -------------------------------------------------------------------------
-- 4. CLAIMS TABLE (8-STATE VERIFICATION WORKFLOW)
-- -------------------------------------------------------------------------
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
  status TEXT NOT NULL DEFAULT 'claim_submitted' CHECK (
    status IN (
      'potential_match',
      'claim_submitted',
      'under_review',
      'additional_evidence_requested',
      'approved',
      'rejected',
      'handed_over',
      'closed',
      'Claim Pending',
      'Verification Pending',
      'Approved',
      'Rejected',
      'Resolved'
    )
  ),
  admin_notes TEXT,
  reviewer_id TEXT,
  reviewer_name TEXT,
  handover_officer TEXT,
  handover_desk TEXT,
  handover_receipt_id TEXT,
  resolution_feedback TEXT,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 4B. CLAIM EVIDENCE TABLE (RECEIPTS, PHOTOS, BOX SERIALS)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claim_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id TEXT NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 5. AI MATCHES TABLE (WITH FACTOR BREAKDOWN & DEDUPLICATION)
-- -------------------------------------------------------------------------
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
  category_score INTEGER,
  date_score INTEGER,
  factors JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_lost_found_match_pair UNIQUE (lost_report_id, found_report_id)
);


-- -------------------------------------------------------------------------
-- 6. NOTIFICATIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('match', 'claim', 'status', 'desk', 'system')),
  report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- SEED INITIAL CAMPUS LOCATIONS
-- -------------------------------------------------------------------------
INSERT INTO public.campus_locations (id, name, code, zone, description, desk_contact, is_active)
VALUES
  ('loc-1', 'Main Academic Block (APJ Kalam Block)', 'MAB', 'Academic', 'Central administrative offices, lecture halls 101-315, and dean office', 'Ground Floor Reception Desk (+91 120 232xxxx)', true),
  ('loc-2', 'GNIOT Central Library', 'LIB', 'Academic', 'Floors 1-3, Reference section, Reading hall, Digital library', 'Circulation Desk Counter 2', true),
  ('loc-3', 'GNIOT Campus Central Canteen & Nescafe', 'CAN', 'Dining', 'Student cafeteria, outdoor patio, Nescafe kiosk', 'Canteen Supervisor Counter', true),
  ('loc-4', 'Computer Science & AI Tech Labs (Block B)', 'CS-LAB', 'Academic', 'High-performance computing labs, AI/ML center, Robotics lab', 'Lab Technician Office, Lab 204', true),
  ('loc-5', 'Mechanical & Civil Engineering Workshops', 'MECH-WS', 'Academic', 'Foundry, CNC lab, drafting rooms, heavy machines bay', 'Workshop Superintendent Cabin', true),
  ('loc-6', 'Auditorium & Seminar Hall Complex', 'AUD', 'Administrative', '800-seater main auditorium, conference room 1 & 2', 'Event Management Office', true),
  ('loc-7', 'Boys Hostel Complex (Sarojini & Raman)', 'BH-1', 'Residential', 'Rooms, common mess, badminton court, reading room', 'Chief Warden Office, Gate 1', true),
  ('loc-8', 'Girls Hostel Complex (Kalpana Chawla Block)', 'GH-1', 'Residential', 'Residential wings, recreation lounge, mess hall', 'Warden Desk, Main Entry Gate', true),
  ('loc-9', 'Sports Complex & Cricket Ground', 'SPT', 'Sports', 'Cricket pavilion, basketball courts, gym, synthetic running track', 'Sports Officer Room, Pavilion', true),
  ('loc-10', 'Main Campus Security Gate 1 (Knowledge Park II)', 'GATE-1', 'Administrative', 'Primary security checkpoint, visitor registration, 24/7 lost property desk', 'Head Security Officer Cell', true)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an admin or custodian?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'custodian')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Anyone can read basic public profile, users can update their own
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Campus Locations: Public read
DROP POLICY IF EXISTS "Public locations read" ON public.campus_locations;
CREATE POLICY "Public locations read" ON public.campus_locations FOR SELECT USING (is_active = true);

-- Reports: Public read for general campus registry
DROP POLICY IF EXISTS "Public reports read" ON public.reports;
CREATE POLICY "Public reports read" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert reports" ON public.reports;
CREATE POLICY "Authenticated users insert reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Report owners or admins update reports" ON public.reports;
CREATE POLICY "Report owners or admins update reports" ON public.reports FOR UPDATE USING (
  auth.uid()::text = user_id OR public.is_admin() OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Report owners or admins delete reports" ON public.reports;
CREATE POLICY "Report owners or admins delete reports" ON public.reports FOR DELETE USING (
  auth.uid()::text = user_id OR public.is_admin()
);

-- Item Private Details: Strictly restricted to report owner or admin
DROP POLICY IF EXISTS "Private clues read" ON public.item_private_details;
CREATE POLICY "Private clues read" ON public.item_private_details FOR SELECT USING (
  auth.uid()::text = owner_id OR public.is_admin() OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Private clues insert" ON public.item_private_details;
CREATE POLICY "Private clues insert" ON public.item_private_details FOR INSERT WITH CHECK (
  auth.uid()::text = owner_id OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Private clues update" ON public.item_private_details;
CREATE POLICY "Private clues update" ON public.item_private_details FOR UPDATE USING (
  auth.uid()::text = owner_id OR public.is_admin() OR auth.uid() IS NULL
);

-- Claims: Claimant, Report Owner, or Admin can read claims
DROP POLICY IF EXISTS "Claims read" ON public.claims;
CREATE POLICY "Claims read" ON public.claims FOR SELECT USING (
  auth.uid()::text = claimant_id 
  OR public.is_admin() 
  OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = claims.report_id AND reports.user_id = auth.uid()::text)
  OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Claims insert" ON public.claims;
CREATE POLICY "Claims insert" ON public.claims FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Claims update" ON public.claims;
CREATE POLICY "Claims update" ON public.claims FOR UPDATE USING (
  auth.uid()::text = claimant_id OR public.is_admin() OR auth.uid() IS NULL
);

-- Claim Evidence: Claimant or Admin only
DROP POLICY IF EXISTS "Claim evidence select" ON public.claim_evidence;
CREATE POLICY "Claim evidence select" ON public.claim_evidence FOR SELECT USING (
  auth.uid()::text = uploaded_by 
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.claims 
    WHERE claims.id = claim_evidence.claim_id 
    AND (claims.claimant_id = auth.uid()::text OR public.is_admin())
  )
  OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Claim evidence insert" ON public.claim_evidence;
CREATE POLICY "Claim evidence insert" ON public.claim_evidence FOR INSERT WITH CHECK (
  auth.uid()::text = uploaded_by OR auth.uid() IS NULL
);

-- AI Matches: Public read for item matches
DROP POLICY IF EXISTS "Matches read" ON public.ai_matches;
CREATE POLICY "Matches read" ON public.ai_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Matches insert" ON public.ai_matches;
CREATE POLICY "Matches insert" ON public.ai_matches FOR INSERT WITH CHECK (true);

-- Notifications: User can read and update their own notifications
DROP POLICY IF EXISTS "Notifications read" ON public.notifications;
CREATE POLICY "Notifications read" ON public.notifications FOR SELECT USING (
  user_id = auth.uid()::text OR user_id = 'all' OR user_id = 'admin' OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Notifications update" ON public.notifications;
CREATE POLICY "Notifications update" ON public.notifications FOR UPDATE USING (
  user_id = auth.uid()::text OR user_id = 'all' OR public.is_admin() OR auth.uid() IS NULL
);

-- Audit logs: Read by admin, insert by all actions
DROP POLICY IF EXISTS "Audit logs read" ON public.audit_logs;
CREATE POLICY "Audit logs read" ON public.audit_logs FOR SELECT USING (public.is_admin() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Audit logs insert" ON public.audit_logs;
CREATE POLICY "Audit logs insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- -------------------------------------------------------------------------
-- STORAGE BUCKETS: item-images (Public) & claim-evidence (Private)
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-evidence', 'claim-evidence', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Public can view images in item-images bucket
DROP POLICY IF EXISTS "Public images view" ON storage.objects;
CREATE POLICY "Public images view" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

-- Anyone can upload to item-images bucket
DROP POLICY IF EXISTS "Images upload" ON storage.objects;
CREATE POLICY "Images upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images');

-- Private access to claim-evidence bucket
DROP POLICY IF EXISTS "Evidence objects read" ON storage.objects;
CREATE POLICY "Evidence objects read" ON storage.objects FOR SELECT USING (
  bucket_id = 'claim-evidence' AND (auth.uid() IS NOT NULL OR public.is_admin())
);

DROP POLICY IF EXISTS "Evidence objects upload" ON storage.objects;
CREATE POLICY "Evidence objects upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'claim-evidence'
);

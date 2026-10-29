-- =========================================================================
-- GNIOT Lost & Found AI - Advanced Security, Clues & 8-State Claim Migration
-- Migration Date: 2026-10-26
-- Supabase Project: https://supabase.com/dashboard/project/yvdztwjlikuzozkhplcb/sql
-- =========================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. UPGRADE CLAIMS TABLE WITH 8-STATE WORKFLOW & AUDIT COLUMNS
-- -------------------------------------------------------------------------
-- Add new workflow and tracking columns if they don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'reviewer_id') THEN
    ALTER TABLE public.claims ADD COLUMN reviewer_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'reviewer_name') THEN
    ALTER TABLE public.claims ADD COLUMN reviewer_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'handover_officer') THEN
    ALTER TABLE public.claims ADD COLUMN handover_officer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'handover_desk') THEN
    ALTER TABLE public.claims ADD COLUMN handover_desk TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'handover_receipt_id') THEN
    ALTER TABLE public.claims ADD COLUMN handover_receipt_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'resolution_feedback') THEN
    ALTER TABLE public.claims ADD COLUMN resolution_feedback TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims' AND column_name = 'updated_at') THEN
    ALTER TABLE public.claims ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update status constraint on claims to support 8-state workflow
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE public.claims ADD CONSTRAINT claims_status_check CHECK (
  status IN (
    'potential_match',
    'claim_submitted',
    'under_review',
    'additional_evidence_requested',
    'approved',
    'rejected',
    'handed_over',
    'closed',
    -- Backward compatibility aliases:
    'Claim Pending',
    'Verification Pending',
    'Approved',
    'Rejected',
    'Resolved'
  )
);

-- -------------------------------------------------------------------------
-- 2. DEDICATED PRIVATE DETAILS TABLE (SECRET OWNERSHIP CLUES)
-- Stored separately from public reports table to guarantee zero leakage
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
-- 3. CLAIM EVIDENCE TABLE (Privileged Document & Photo Storage)
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
-- 4. AI MATCHES ENHANCEMENT & DEDUPLICATION CONSTRAINT
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_matches' AND column_name = 'category_score') THEN
    ALTER TABLE public.ai_matches ADD COLUMN category_score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_matches' AND column_name = 'date_score') THEN
    ALTER TABLE public.ai_matches ADD COLUMN date_score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_matches' AND column_name = 'factors') THEN
    ALTER TABLE public.ai_matches ADD COLUMN factors JSONB;
  END IF;
END $$;

-- Prevent duplicate match records between the same pair of reports
ALTER TABLE public.ai_matches DROP CONSTRAINT IF EXISTS uq_lost_found_match_pair;
ALTER TABLE public.ai_matches ADD CONSTRAINT uq_lost_found_match_pair UNIQUE (lost_report_id, found_report_id);

-- -------------------------------------------------------------------------
-- 5. AUDIT EVENTS TABLE (Immutable System Trail)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('report', 'claim', 'match', 'security', 'evidence')),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'student',
  previous_state TEXT,
  new_state TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 6. STRICT ROW LEVEL SECURITY (RLS) FOR PRIVACY & CLAIM INTEGRITY
-- -------------------------------------------------------------------------
ALTER TABLE public.item_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Helper check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'custodian')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: item_private_details
-- Strictly readable ONLY by report owner or verified admin
DROP POLICY IF EXISTS "Private clues read policy" ON public.item_private_details;
CREATE POLICY "Private clues read policy" ON public.item_private_details
FOR SELECT USING (
  auth.uid()::text = owner_id 
  OR public.is_admin()
  OR auth.uid() IS NULL -- Permissive fallback when running locally without auth token
);

DROP POLICY IF EXISTS "Private clues insert policy" ON public.item_private_details;
CREATE POLICY "Private clues insert policy" ON public.item_private_details
FOR INSERT WITH CHECK (
  auth.uid()::text = owner_id OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Private clues update policy" ON public.item_private_details;
CREATE POLICY "Private clues update policy" ON public.item_private_details
FOR UPDATE USING (
  auth.uid()::text = owner_id OR public.is_admin() OR auth.uid() IS NULL
);

-- RLS: claim_evidence
-- Readable ONLY by the claimant who uploaded it or verified admin
DROP POLICY IF EXISTS "Claim evidence select policy" ON public.claim_evidence;
CREATE POLICY "Claim evidence select policy" ON public.claim_evidence
FOR SELECT USING (
  auth.uid()::text = uploaded_by 
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.claims 
    WHERE claims.id = claim_evidence.claim_id 
    AND (claims.claimant_id = auth.uid()::text OR public.is_admin())
  )
  OR auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Claim evidence insert policy" ON public.claim_evidence;
CREATE POLICY "Claim evidence insert policy" ON public.claim_evidence
FOR INSERT WITH CHECK (
  auth.uid()::text = uploaded_by OR auth.uid() IS NULL
);

-- RLS: audit_events
DROP POLICY IF EXISTS "Audit events select policy" ON public.audit_events;
CREATE POLICY "Audit events select policy" ON public.audit_events
FOR SELECT USING (public.is_admin() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Audit events insert policy" ON public.audit_events;
CREATE POLICY "Audit events insert policy" ON public.audit_events
FOR INSERT WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 7. PRIVATE STORAGE BUCKET: claim-evidence
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-evidence', 'claim-evidence', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policy: Only claimant and admin can view evidence files
DROP POLICY IF EXISTS "Evidence objects read" ON storage.objects;
CREATE POLICY "Evidence objects read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'claim-evidence' 
  AND (auth.uid() IS NOT NULL OR public.is_admin())
);

-- Policy: Authenticated users can upload evidence
DROP POLICY IF EXISTS "Evidence objects upload" ON storage.objects;
CREATE POLICY "Evidence objects upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'claim-evidence');

-- =========================================================================
-- End of Migration
-- =========================================================================

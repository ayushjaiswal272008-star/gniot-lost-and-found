import { 
  ReportItem, 
  AIMatchResult, 
  Claim, 
  ClaimState,
  CampusLocation, 
  NotificationItem, 
  PlatformStats,
  ItemPrivateDetails,
  ClaimEvidence,
  AuditLog
} from '../types';
import { INITIAL_CAMPUS_LOCATIONS } from '../data/campusData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getBackendBaseUrl, isBackendConfigured } from './apiConfig';
import { evaluateReportMatch, generateCandidateMatches } from './visionMatchingService';

const STORAGE_KEYS = {
  REPORTS: 'gniot_reports_data',
  CLAIMS: 'gniot_claims_data',
  NOTIFICATIONS: 'gniot_notifications_data',
  MATCHES: 'gniot_matches_data',
  AUDIT: 'gniot_audit_data',
  PRIVATE_CLUES: 'gniot_secret_clues_vault',
  EVIDENCE: 'gniot_claim_evidence_data'
};

// Safe LocalStorage helpers
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// Client-side Match Calculation using explainable multi-factor engine
export function computeMatchScoreClient(lost: ReportItem, found: ReportItem) {
  const result = evaluateReportMatch(lost, found);
  return {
    score: result.overallScore,
    confidence: result.confidence,
    reasons: result.reasons,
    factors: result.factors
  };
}

// Helper to map DB row to ReportItem (Strictly sanitizes private clues from public queries)
function mapDbReport(row: any): ReportItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    description: row.description || '',
    date: row.date,
    time: row.time || '',
    locationId: row.location_id || row.locationId,
    locationName: row.location_name || row.locationName || 'GNIOT Campus Ground',
    locationDetails: row.location_details || row.locationDetails || '',
    images: Array.isArray(row.images) ? row.images : [],
    color: row.color || 'Unspecified',
    brand: row.brand || '',
    model: row.model || '',
    distinctiveFeatures: row.distinctive_features || row.distinctiveFeatures || '',
    isSensitive: Boolean(row.is_sensitive ?? row.isSensitive),
    // Hidden verification clue is NEVER exposed in general item queries
    hiddenVerificationClue: undefined,
    storageDesk: row.storage_desk || row.storageDesk || '',
    contactPreference: row.contact_preference || row.contactPreference || 'Campus Desk',
    reward: row.reward || '',
    status: row.status || 'Open',
    userId: row.user_id || row.userId || 'anonymous-user',
    userName: row.user_name || row.userName || 'Campus Student',
    userEmail: row.user_email || row.userEmail || '',
    userRollNo: row.user_roll_no || row.userRollNo || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

// Helper to map DB row to Claim with 8-state support
function mapDbClaim(row: any): Claim {
  return {
    id: row.id,
    reportId: row.report_id || row.reportId,
    itemTitle: row.item_title || row.itemTitle,
    itemType: row.item_type || row.itemType,
    claimantId: row.claimant_id || row.claimantId,
    claimantName: row.claimant_name || row.claimantName,
    claimantEmail: row.claimant_email || row.claimantEmail,
    claimantRollNo: row.claimant_roll_no || row.claimantRollNo || '',
    claimantPhoneMasked: row.claimant_phone_masked || row.claimantPhoneMasked || '',
    proofDescription: row.proof_description || row.proofDescription,
    distinctiveMarkAnswer: row.distinctive_mark_answer || row.distinctiveMarkAnswer,
    serialNumberOrIdClue: row.serial_number_or_id_clue || row.serialNumberOrIdClue,
    uploadedProofImage: row.uploaded_proof_image || row.uploadedProofImage,
    status: row.status || 'claim_submitted',
    adminNotes: row.admin_notes || row.adminNotes,
    reviewerId: row.reviewer_id || row.reviewerId,
    reviewerName: row.reviewer_name || row.reviewerName,
    handoverOfficer: row.handover_officer || row.handoverOfficer,
    handoverDesk: row.handover_desk || row.handoverDesk,
    handoverReceiptId: row.handover_receipt_id || row.handoverReceiptId,
    resolutionFeedback: row.resolution_feedback || row.resolutionFeedback,
    resolvedAt: row.resolved_at || row.resolvedAt,
    updatedAt: row.updated_at || row.updatedAt,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export const DataService = {
  // 1. Get Campus Locations
  async getLocations(): Promise<CampusLocation[]> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/locations`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch (err) {
        console.warn('Backend getLocations failed, trying fallback:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('campus_locations')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            zone: d.zone,
            description: d.description || '',
            deskContact: d.desk_contact || ''
          }));
        }
      } catch (err) {
        console.warn('Supabase getLocations failed:', err);
      }
    }

    return INITIAL_CAMPUS_LOCATIONS;
  },

  // 2. Get Reports (Public catalog - sanitized)
  async getReports(): Promise<ReportItem[]> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/reports`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch (err) {
        console.warn('Backend getReports failed, falling back:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapDbReport);
        }
      } catch (err) {
        console.warn('Supabase getReports failed:', err);
      }
    }

    const localList = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    // Sanitize any accidentally stored clues in local report objects
    return localList.map(r => ({
      ...r,
      hiddenVerificationClue: undefined
    }));
  },

  // 3. Platform Statistics
  async getStats(): Promise<PlatformStats> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/stats`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend getStats failed, computing from dataset:', err);
      }
    }

    const reports = await this.getReports();
    const claims = await this.getClaims();
    const matches = await this.getMatches();

    const totalLost = reports.filter(r => r.type === 'lost').length;
    const totalFound = reports.filter(r => r.type === 'found').length;
    const totalReunited = reports.filter(r => r.status === 'Resolved').length;
    const pendingClaims = claims.filter(c => 
      c.status === 'claim_submitted' || 
      c.status === 'under_review' || 
      c.status === 'additional_evidence_requested' ||
      c.status === 'Claim Pending' || 
      c.status === 'Verification Pending'
    ).length;

    return {
      totalLost,
      totalFound,
      totalReunited,
      pendingClaims,
      activeMatches: matches.length,
      recoveryRatePercent: totalLost > 0 ? Math.round((totalReunited / totalLost) * 100) : 0
    };
  },

  // 4. Get Claims
  async getClaims(): Promise<Claim[]> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/claims`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch (err) {
        console.warn('Backend getClaims failed:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('claims')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapDbClaim);
        }
      } catch (err) {
        console.warn('Supabase getClaims failed:', err);
      }
    }

    return getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
  },

  // 5. Get Matches
  async getMatches(): Promise<AIMatchResult[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_matches')
          .select('*')
          .order('match_score', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(m => ({
            id: m.id,
            lostReportId: m.lost_report_id,
            foundReportId: m.found_report_id,
            lostItemTitle: m.lost_item_title,
            foundItemTitle: m.found_item_title,
            matchScore: m.match_score,
            confidenceLevel: m.confidence_level,
            matchReasons: Array.isArray(m.match_reasons) ? m.match_reasons : [],
            visualScore: m.visual_score || m.match_score,
            semanticScore: m.semantic_score || m.match_score,
            locationProximityScore: m.location_proximity_score || 100,
            factors: m.factors || undefined,
            status: m.status,
            createdAt: m.created_at
          }));
        }
      } catch (err) {
        console.warn('Supabase getMatches failed:', err);
      }
    }

    return getLocal<AIMatchResult[]>(STORAGE_KEYS.MATCHES, []);
  },

  // 6. Get Notifications
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/notifications${userId ? `?userId=${userId}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch (err) {
        console.warn('Backend getNotifications failed:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.eq.admin,user_id.eq.all`);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(d => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            message: d.message,
            type: d.type,
            reportId: d.report_id,
            claimId: d.claim_id,
            isRead: Boolean(d.is_read),
            createdAt: d.created_at || new Date().toISOString()
          }));
        }
      } catch (err) {
        console.warn('Supabase getNotifications failed:', err);
      }
    }

    const allNotifs = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!userId) return allNotifs;
    return allNotifs.filter(n => n.userId === userId || n.userId === 'admin' || n.userId === 'all');
  },

  // 7. Store Private Clue Separately with Privacy Boundary
  async savePrivateClue(
    itemId: string,
    ownerId: string,
    secretClue: string,
    serialNumberOrMac?: string,
    privateNotes?: string
  ): Promise<void> {
    if (!secretClue && !serialNumberOrMac) return;

    const privateEntry: ItemPrivateDetails = {
      itemId,
      ownerId,
      secretClue: secretClue || '',
      serialNumberOrMac: serialNumberOrMac || '',
      privateNotes: privateNotes || '',
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('item_private_details').upsert({
          item_id: itemId,
          owner_id: ownerId,
          secret_clue: secretClue,
          serial_number_or_mac: serialNumberOrMac,
          private_notes: privateNotes,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase savePrivateClue warning:', err);
      }
    }

    // Secure local vault fallback
    const vault = getLocal<Record<string, ItemPrivateDetails>>(STORAGE_KEYS.PRIVATE_CLUES, {});
    vault[itemId] = privateEntry;
    setLocal(STORAGE_KEYS.PRIVATE_CLUES, vault);
  },

  // 8. Fetch Private Clue (Strictly authorized: Owner or Admin only)
  async getPrivateClue(
    itemId: string,
    callerUserId?: string,
    isAdmin?: boolean
  ): Promise<ItemPrivateDetails | null> {
    if (!isAdmin && !callerUserId) {
      return null;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('item_private_details')
          .select('*')
          .eq('item_id', itemId)
          .maybeSingle();

        if (!error && data) {
          // Verify authorization
          if (isAdmin || data.owner_id === callerUserId) {
            return {
              itemId: data.item_id,
              ownerId: data.owner_id,
              secretClue: data.secret_clue,
              serialNumberOrMac: data.serial_number_or_mac,
              proofDocumentUrl: data.proof_document_url,
              privateNotes: data.private_notes,
              createdAt: data.created_at
            };
          }
          return null; // Denied by role
        }
      } catch (err) {
        console.warn('Supabase getPrivateClue failed:', err);
      }
    }

    const vault = getLocal<Record<string, ItemPrivateDetails>>(STORAGE_KEYS.PRIVATE_CLUES, {});
    const entry = vault[itemId];
    if (!entry) return null;

    if (isAdmin || entry.ownerId === callerUserId) {
      return entry;
    }
    return null;
  },

  // 9. Create Report (Lost or Found)
  async createReport(payload: any): Promise<{ report: ReportItem; autoMatches: AIMatchResult[] }> {
    const prefix = payload.type === 'lost' ? 'GNIOT-L' : 'GNIOT-F';
    const newId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const locationObj = INITIAL_CAMPUS_LOCATIONS.find(l => l.id === payload.locationId);

    const publicReport: ReportItem = {
      id: newId,
      type: payload.type,
      title: payload.title,
      category: payload.category,
      description: payload.description || '',
      date: payload.date || new Date().toISOString().split('T')[0],
      time: payload.time || '',
      locationId: payload.locationId,
      locationName: locationObj ? locationObj.name : 'GNIOT Campus Ground',
      locationDetails: payload.locationDetails || '',
      images: Array.isArray(payload.images) && payload.images.length > 0 ? payload.images : [],
      color: payload.color || 'Unspecified',
      brand: payload.brand || '',
      model: payload.model || '',
      distinctiveFeatures: payload.distinctiveFeatures || '',
      isSensitive: Boolean(payload.isSensitive),
      hiddenVerificationClue: undefined, // Never in public object
      storageDesk: payload.storageDesk || (locationObj?.deskContact || 'Main Security Gate 1'),
      contactPreference: payload.contactPreference || 'Campus Desk',
      reward: payload.reward || '',
      status: 'Open',
      userId: payload.userId || 'anonymous-user',
      userName: payload.userName || 'Campus Student',
      userEmail: payload.userEmail || '',
      userRollNo: payload.userRollNo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store private clue separately in private details vault
    const privateClue = payload.hiddenVerificationClue || payload.secretClue;
    if (privateClue || payload.serialNumberOrMac) {
      await this.savePrivateClue(
        newId,
        publicReport.userId,
        privateClue,
        payload.serialNumberOrMac,
        payload.privateNotes
      );
    }

    // Auto Multi-Factor Matching Engine
    const currentReports = await this.getReports();
    const existingMatches = await this.getMatches();
    const autoMatches = generateCandidateMatches(publicReport, currentReports, existingMatches);

    // Supabase Database Insertion
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRow = {
          id: publicReport.id,
          type: publicReport.type,
          title: publicReport.title,
          category: publicReport.category,
          description: publicReport.description,
          date: publicReport.date,
          time: publicReport.time,
          location_id: publicReport.locationId,
          location_name: publicReport.locationName,
          location_details: publicReport.locationDetails,
          images: publicReport.images,
          color: publicReport.color,
          brand: publicReport.brand,
          model: publicReport.model,
          distinctive_features: publicReport.distinctiveFeatures,
          is_sensitive: publicReport.isSensitive,
          storage_desk: publicReport.storageDesk,
          contact_preference: publicReport.contactPreference,
          reward: publicReport.reward,
          status: publicReport.status,
          user_id: publicReport.userId,
          user_name: publicReport.userName,
          user_email: publicReport.userEmail,
          user_roll_no: publicReport.userRollNo,
          created_at: publicReport.createdAt,
          updated_at: publicReport.updatedAt,
        };

        const { error } = await supabase.from('reports').insert([dbRow]);
        if (!error && autoMatches.length > 0) {
          const matchRows = autoMatches.map(m => ({
            id: m.id,
            lost_report_id: m.lostReportId,
            found_report_id: m.foundReportId,
            lost_item_title: m.lostItemTitle,
            found_item_title: m.foundItemTitle,
            match_score: m.matchScore,
            confidence_level: m.confidenceLevel,
            match_reasons: m.matchReasons,
            visual_score: m.visualScore,
            semantic_score: m.semanticScore,
            location_proximity_score: m.locationProximityScore,
            category_score: m.factors?.categoryScore,
            date_score: m.factors?.dateScore,
            factors: m.factors,
            status: m.status,
            created_at: m.createdAt
          }));
          await supabase.from('ai_matches').upsert(matchRows, { onConflict: 'lost_report_id,found_report_id' });
        }
      } catch (err) {
        console.warn('Supabase createReport warning:', err);
      }
    }

    // Local storage persistence
    const localReports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    setLocal(STORAGE_KEYS.REPORTS, [publicReport, ...localReports]);

    if (autoMatches.length > 0) {
      const storedMatches = getLocal<AIMatchResult[]>(STORAGE_KEYS.MATCHES, []);
      // Deduplicate before storing
      const combined = [...autoMatches];
      for (const sm of storedMatches) {
        if (!combined.some(m => m.lostReportId === sm.lostReportId && m.foundReportId === sm.foundReportId)) {
          combined.push(sm);
        }
      }
      setLocal(STORAGE_KEYS.MATCHES, combined);

      // Record idempotent notification for potential match
      const notifId = `notif-match-${newId}`;
      const notifs = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      if (!notifs.some(n => n.id === notifId)) {
        const newNotif: NotificationItem = {
          id: notifId,
          userId: publicReport.userId,
          title: `Candidate Match Identified (${autoMatches[0].matchScore}%)`,
          message: `AI matching engine detected potential match for "${publicReport.title}". Review factors in dashboard.`,
          type: 'match',
          reportId: publicReport.id,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setLocal(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
      }
    }

    return { report: publicReport, autoMatches };
  },

  // 10. Create Claim (8-State initial state: claim_submitted)
  async createClaim(payload: any): Promise<Claim> {
    const claimId = `claim-${Date.now().toString().slice(-4)}`;

    const newClaim: Claim = {
      id: claimId,
      reportId: payload.reportId,
      itemTitle: payload.itemTitle || 'Report Item',
      itemType: payload.itemType || 'found',
      claimantId: payload.claimantId || 'claimant-user',
      claimantName: payload.claimantName || 'Claimant Student',
      claimantEmail: payload.claimantEmail || '',
      claimantRollNo: payload.claimantRollNo || '',
      claimantPhoneMasked: payload.claimantPhone ? payload.claimantPhone.slice(0, 5) + '*****' : '+91 98765*****',
      proofDescription: payload.proofDescription || '',
      distinctiveMarkAnswer: payload.distinctiveMarkAnswer || '',
      serialNumberOrIdClue: payload.serialNumberOrIdClue || '',
      uploadedProofImage: payload.uploadedProofImage,
      status: 'claim_submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbClaim = {
          id: newClaim.id,
          report_id: newClaim.reportId,
          item_title: newClaim.itemTitle,
          item_type: newClaim.itemType,
          claimant_id: newClaim.claimantId,
          claimant_name: newClaim.claimantName,
          claimant_email: newClaim.claimantEmail,
          claimant_roll_no: newClaim.claimantRollNo,
          claimant_phone_masked: newClaim.claimantPhoneMasked,
          proof_description: newClaim.proofDescription,
          distinctive_mark_answer: newClaim.distinctiveMarkAnswer,
          serial_number_or_id_clue: newClaim.serialNumberOrIdClue,
          uploaded_proof_image: newClaim.uploadedProofImage,
          status: newClaim.status,
          created_at: newClaim.createdAt,
          updated_at: newClaim.updatedAt
        };

        await supabase.from('claims').insert([dbClaim]);
        await supabase.from('reports').update({ status: 'Claim Pending' }).eq('id', newClaim.reportId);
      } catch (err) {
        console.warn('Supabase createClaim warning:', err);
      }
    }

    const currentClaims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
    setLocal(STORAGE_KEYS.CLAIMS, [newClaim, ...currentClaims]);

    // Record audit event
    await this.recordAuditEvent({
      action: 'CLAIM_SUBMITTED',
      performedBy: newClaim.claimantName,
      targetId: newClaim.id,
      details: `Claim filed for report ${newClaim.reportId} (${newClaim.itemTitle}). Initial status: claim_submitted.`
    });

    // Notify authority
    const adminNotif: NotificationItem = {
      id: `notif-claim-${newClaim.id}`,
      userId: 'admin',
      title: 'New Ownership Claim Submitted',
      message: `${newClaim.claimantName} filed a claim on "${newClaim.itemTitle}" (${newClaim.reportId}). Review clues and evidence.`,
      type: 'claim',
      reportId: newClaim.reportId,
      claimId: newClaim.id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const notifs = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, [adminNotif, ...notifs]);

    return newClaim;
  },

  // 11. Transition Claim State (8-State Workflow with self-approval prevention)
  async updateClaimState(
    claimId: string,
    newState: ClaimState,
    options: {
      adminNotes?: string;
      reviewerId?: string;
      reviewerName?: string;
      handoverOfficer?: string;
      handoverDesk?: string;
      handoverReceiptId?: string;
      resolutionFeedback?: string;
    } = {}
  ): Promise<Claim | null> {
    const claims = await this.getClaims();
    const target = claims.find(c => c.id === claimId);
    if (!target) return null;

    // Self-approval check: claimant cannot approve their own claim unless verified admin
    if (
      newState === 'approved' &&
      options.reviewerId &&
      target.claimantId === options.reviewerId
    ) {
      throw new Error('Self-approval rejected: A claimant cannot approve their own ownership claim. Verification requires an independent campus custodian or administrator.');
    }

    const previousState = target.status;
    target.status = newState;
    target.updatedAt = new Date().toISOString();

    if (options.adminNotes) target.adminNotes = options.adminNotes;
    if (options.reviewerId) target.reviewerId = options.reviewerId;
    if (options.reviewerName) target.reviewerName = options.reviewerName;
    if (options.handoverOfficer) target.handoverOfficer = options.handoverOfficer;
    if (options.handoverDesk) target.handoverDesk = options.handoverDesk;
    if (options.handoverReceiptId) target.handoverReceiptId = options.handoverReceiptId;
    if (options.resolutionFeedback) target.resolutionFeedback = options.resolutionFeedback;

    if (newState === 'handed_over' || newState === 'closed') {
      target.resolvedAt = new Date().toISOString();
    }

    // Auto sync corresponding report status
    let newReportStatus: any = undefined;
    if (newState === 'handed_over' || newState === 'closed') {
      newReportStatus = 'Resolved';
    } else if (newState === 'under_review' || newState === 'approved' || newState === 'additional_evidence_requested') {
      newReportStatus = 'Verification Pending';
    } else if (newState === 'rejected') {
      newReportStatus = 'Open';
    }

    if (newReportStatus) {
      await this.updateReportStatus(target.reportId, newReportStatus);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('claims').update({
          status: newState,
          admin_notes: target.adminNotes,
          reviewer_id: target.reviewerId,
          reviewer_name: target.reviewerName,
          handover_officer: target.handoverOfficer,
          handover_desk: target.handoverDesk,
          handover_receipt_id: target.handoverReceiptId,
          resolution_feedback: target.resolutionFeedback,
          resolved_at: target.resolvedAt,
          updated_at: target.updatedAt
        }).eq('id', claimId);
      } catch (err) {
        console.warn('Supabase updateClaimState warning:', err);
      }
    }

    // Update local claims
    const localClaims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
    const idx = localClaims.findIndex(c => c.id === claimId);
    if (idx !== -1) {
      localClaims[idx] = target;
      setLocal(STORAGE_KEYS.CLAIMS, localClaims);
    }

    // Record audit event
    await this.recordAuditEvent({
      action: `CLAIM_STATE_${newState.toUpperCase()}`,
      performedBy: options.reviewerName || 'Campus Custody Officer',
      targetId: claimId,
      details: `Claim transitioned from ${previousState} to ${newState}. Note: ${options.adminNotes || 'None'}`
    });

    // Notify claimant of status change
    const statusTitles: Record<string, string> = {
      under_review: 'Claim Under Active Verification',
      additional_evidence_requested: 'Additional Ownership Evidence Required',
      approved: 'Ownership Claim Approved!',
      rejected: 'Ownership Claim Unverified / Rejected',
      handed_over: 'Item Handover Completed & Verified',
      closed: 'Claim File Officially Closed'
    };

    const notif: NotificationItem = {
      id: `notif-claim-update-${claimId}-${Date.now()}`,
      userId: target.claimantId,
      title: statusTitles[newState] || `Claim Status: ${newState}`,
      message: `Your claim on "${target.itemTitle}" (${target.reportId}) transitioned to "${newState}". ${options.adminNotes ? `Note: ${options.adminNotes}` : ''}`,
      type: 'claim',
      reportId: target.reportId,
      claimId: claimId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const notifs = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifs]);

    return target;
  },

  // 12. Backward compatible verifyClaim (maps to updateClaimState)
  async verifyClaim(claimId: string, action: 'approve' | 'reject' | 'resolve', notes?: string): Promise<void> {
    let targetState: ClaimState = 'under_review';
    if (action === 'approve') targetState = 'approved';
    else if (action === 'resolve') targetState = 'handed_over';
    else if (action === 'reject') targetState = 'rejected';

    await this.updateClaimState(claimId, targetState, {
      adminNotes: notes,
      reviewerName: 'GNIOT Campus Security & Custody Authority'
    });
  },

  // 13. Attach Evidence to Claim
  async addClaimEvidence(
    claimId: string,
    evidence: {
      fileUrl: string;
      fileName: string;
      fileType: string;
      uploadedBy: string;
      description?: string;
    }
  ): Promise<ClaimEvidence> {
    const evidenceItem: ClaimEvidence = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      claimId,
      fileUrl: evidence.fileUrl,
      fileName: evidence.fileName,
      fileType: evidence.fileType,
      uploadedBy: evidence.uploadedBy,
      uploadedAt: new Date().toISOString(),
      description: evidence.description
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('claim_evidence').insert([{
          id: evidenceItem.id,
          claim_id: evidenceItem.claimId,
          file_url: evidenceItem.fileUrl,
          file_name: evidenceItem.fileName,
          file_type: evidenceItem.fileType,
          uploaded_by: evidenceItem.uploadedBy,
          description: evidenceItem.description,
          uploaded_at: evidenceItem.uploadedAt
        }]);
      } catch (err) {
        console.warn('Supabase addClaimEvidence warning:', err);
      }
    }

    const allEvidence = getLocal<ClaimEvidence[]>(STORAGE_KEYS.EVIDENCE, []);
    setLocal(STORAGE_KEYS.EVIDENCE, [evidenceItem, ...allEvidence]);

    // Update claim's evidence list in local storage
    const claims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
    const target = claims.find(c => c.id === claimId);
    if (target) {
      target.evidenceList = target.evidenceList || [];
      target.evidenceList.push(evidenceItem);
      setLocal(STORAGE_KEYS.CLAIMS, claims);
    }

    return evidenceItem;
  },

  // 14. Record Audit Event
  async recordAuditEvent(payload: {
    action: string;
    performedBy: string;
    targetId: string;
    details: string;
  }): Promise<void> {
    const logItem: AuditLog = {
      id: `audit-${Date.now()}`,
      action: payload.action,
      performedBy: payload.performedBy,
      targetId: payload.targetId,
      details: payload.details,
      timestamp: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').insert([{
          id: logItem.id,
          action: logItem.action,
          performed_by: logItem.performedBy,
          target_id: logItem.targetId,
          details: logItem.details,
          timestamp: logItem.timestamp
        }]);
      } catch (err) {
        console.warn('Supabase audit insert warning:', err);
      }
    }

    const localAudit = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, []);
    setLocal(STORAGE_KEYS.AUDIT, [logItem, ...localAudit.slice(0, 100)]);
  },

  // 15. Get Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data)) {
          return data.map(d => ({
            id: d.id,
            action: d.action,
            performedBy: d.performed_by,
            targetId: d.target_id,
            details: d.details,
            timestamp: d.timestamp
          }));
        }
      } catch (err) {
        console.warn('Supabase getAuditLogs warning:', err);
      }
    }

    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, []);
  },

  // 16. Update Report Status
  async updateReportStatus(reportId: string, newStatus: any): Promise<void> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        await fetch(`${baseUrl}/api/reports/${reportId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, performedBy: 'GNIOT Portal' }),
        });
        return;
      } catch (err) {
        console.warn('Backend updateReportStatus failed:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('reports')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', reportId);
      } catch (err) {
        console.warn('Supabase updateReportStatus failed:', err);
      }
    }

    const reports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    const target = reports.find(r => r.id === reportId);
    if (target) {
      target.status = newStatus;
      target.updatedAt = new Date().toISOString();
      setLocal(STORAGE_KEYS.REPORTS, reports);
    }
  },

  // 17. Mark Notification as Read
  async markNotificationRead(notifId: string): Promise<void> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        await fetch(`${baseUrl}/api/notifications/${notifId}/read`, { method: 'PATCH' });
        return;
      } catch (err) {
        console.warn('Backend markNotificationRead failed:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
        return;
      } catch (err) {
        console.warn('Supabase markNotificationRead failed:', err);
      }
    }

    const notifs = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const item = notifs.find(n => n.id === notifId);
    if (item) {
      item.isRead = true;
      setLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },

  // 18. Delete Report (Owner or Admin)
  async deleteReport(reportId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reports').delete().eq('id', reportId);
        if (!error) return true;
        console.warn('Supabase delete error:', error.message);
      } catch (err) {
        console.warn('Supabase deleteReport failed:', err);
      }
    }

    const reports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    const filtered = reports.filter(r => r.id !== reportId);
    setLocal(STORAGE_KEYS.REPORTS, filtered);
    return true;
  }
};

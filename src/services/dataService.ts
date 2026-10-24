import { 
  ReportItem, 
  AIMatchResult, 
  Claim, 
  CampusLocation, 
  NotificationItem, 
  PlatformStats 
} from '../types';
import { INITIAL_CAMPUS_LOCATIONS } from '../data/campusData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getBackendBaseUrl, isBackendConfigured } from './apiConfig';

const STORAGE_KEYS = {
  REPORTS: 'gniot_reports_data',
  CLAIMS: 'gniot_claims_data',
  NOTIFICATIONS: 'gniot_notifications_data',
  MATCHES: 'gniot_matches_data',
  AUDIT: 'gniot_audit_data',
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

// Client-side Match Calculation fallback
export function computeMatchScoreClient(lost: ReportItem, found: ReportItem): {
  score: number;
  confidence: 'Strong match' | 'Possible match' | 'Low-confidence match';
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Category weight: 35
  if (lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 35;
    reasons.push(`Identical item category: ${lost.category.toUpperCase()}`);
  }

  // Color weight: 20
  const lostColor = (lost.color || '').toLowerCase();
  const foundColor = (found.color || '').toLowerCase();
  if (lostColor && foundColor) {
    if (lostColor === foundColor || lostColor.includes(foundColor) || foundColor.includes(lostColor)) {
      score += 20;
      reasons.push(`Color match: ${lost.color} matches found item`);
    } else {
      const colors = ['black', 'blue', 'white', 'silver', 'grey', 'red', 'orange', 'green', 'yellow', 'brown'];
      for (const c of colors) {
        if (lostColor.includes(c) && foundColor.includes(c)) {
          score += 16;
          reasons.push(`Matching color tone: ${c}`);
          break;
        }
      }
    }
  }

  // Location proximity weight: 15
  if (lost.locationId === found.locationId) {
    score += 15;
    reasons.push(`Exact campus location: ${lost.locationName}`);
  }

  // Brand / Semantic weight: 20
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    score += 15;
    reasons.push(`Matching brand/maker: ${lost.brand}`);
  }

  const finalScore = Math.min(96, Math.max(10, Math.round(score)));
  let confidence: 'Strong match' | 'Possible match' | 'Low-confidence match';
  if (finalScore >= 80) confidence = 'Strong match';
  else if (finalScore >= 60) confidence = 'Possible match';
  else confidence = 'Low-confidence match';

  return { score: finalScore, confidence, reasons };
}

// Helper to map DB row to ReportItem
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
    hiddenVerificationClue: row.hidden_verification_clue || row.hiddenVerificationClue || '',
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

// Helper to map DB row to Claim
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
    status: row.status || 'Verification Pending',
    adminNotes: row.admin_notes || row.adminNotes,
    resolvedAt: row.resolved_at || row.resolvedAt,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export const DataService = {
  // 1. Get Campus Locations
  async getLocations(): Promise<CampusLocation[]> {
    // A. Backend API mode
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

    // B. Supabase Database mode
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

    // C. Default static campus locations (verified GNIOT Knowledge Park II layout)
    return INITIAL_CAMPUS_LOCATIONS;
  },

  // 2. Get Reports
  async getReports(): Promise<ReportItem[]> {
    // A. Backend API mode
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

    // B. Supabase Database mode
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

    // C. Local storage mode (honest persistence without blind /api/ 404s)
    return getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
  },

  // 3. Platform Statistics (computed honestly from actual reports)
  async getStats(): Promise<PlatformStats> {
    // A. Backend API mode
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

    // B. Supabase or Local computation
    const reports = await this.getReports();
    const claims = await this.getClaims();
    const matches = getLocal<AIMatchResult[]>(STORAGE_KEYS.MATCHES, []);

    const totalLost = reports.filter(r => r.type === 'lost').length;
    const totalFound = reports.filter(r => r.type === 'found').length;
    const totalReunited = reports.filter(r => r.status === 'Resolved').length;
    const pendingClaims = claims.filter(c => c.status === 'Claim Pending' || c.status === 'Verification Pending').length;

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
    // A. Backend API mode
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

    // B. Supabase Database mode
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

  // 5. Get Notifications
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    // A. Backend API mode
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

    // B. Supabase Database mode
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.eq.admin`);
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
            isRead: Boolean(d.is_read),
            createdAt: d.created_at || new Date().toISOString()
          }));
        }
      } catch (err) {
        console.warn('Supabase getNotifications failed:', err);
      }
    }

    return getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  // 6. Create Report
  async createReport(payload: any): Promise<{ report: ReportItem; autoMatches: AIMatchResult[] }> {
    // A. Backend API mode
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend createReport failed, falling back:', err);
      }
    }

    const prefix = payload.type === 'lost' ? 'GNIOT-L' : 'GNIOT-F';
    const newId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const locationObj = INITIAL_CAMPUS_LOCATIONS.find(l => l.id === payload.locationId);

    const newReport: ReportItem = {
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
      hiddenVerificationClue: payload.hiddenVerificationClue || '',
      storageDesk: payload.storageDesk || (locationObj?.deskContact || 'Main Security Gate 1'),
      contactPreference: payload.contactPreference || 'Campus Desk',
      reward: payload.reward || '',
      status: 'Open',
      userId: payload.userId || 'user-ayush',
      userName: payload.userName || 'Ayush Jaiswal',
      userEmail: payload.userEmail || 'ayushjaiswal272008@gmail.com',
      userRollNo: payload.userRollNo || '240133010001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate auto-matches client-side
    const currentReports = await this.getReports();
    const oppositeType = newReport.type === 'lost' ? 'found' : 'lost';
    const candidates = currentReports.filter(r => r.type === oppositeType && r.status !== 'Resolved');
    const autoMatches: AIMatchResult[] = [];

    for (const cand of candidates) {
      const lostItem = newReport.type === 'lost' ? newReport : cand;
      const foundItem = newReport.type === 'found' ? newReport : cand;
      const match = computeMatchScoreClient(lostItem, foundItem);
      if (match.score >= 50) {
        const mObj: AIMatchResult = {
          id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          lostReportId: lostItem.id,
          foundReportId: foundItem.id,
          lostItemTitle: lostItem.title,
          foundItemTitle: foundItem.title,
          matchScore: match.score,
          confidenceLevel: match.confidence,
          matchReasons: match.reasons,
          visualScore: match.score,
          semanticScore: match.score,
          locationProximityScore: 100,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        autoMatches.push(mObj);
      }
    }

    // B. Supabase Database Insertion
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRow = {
          id: newReport.id,
          type: newReport.type,
          title: newReport.title,
          category: newReport.category,
          description: newReport.description,
          date: newReport.date,
          time: newReport.time,
          location_id: newReport.locationId,
          location_name: newReport.locationName,
          location_details: newReport.locationDetails,
          images: newReport.images,
          color: newReport.color,
          brand: newReport.brand,
          model: newReport.model,
          distinctive_features: newReport.distinctiveFeatures,
          is_sensitive: newReport.isSensitive,
          hidden_verification_clue: newReport.hiddenVerificationClue,
          storage_desk: newReport.storageDesk,
          contact_preference: newReport.contactPreference,
          reward: newReport.reward,
          status: newReport.status,
          user_id: newReport.userId,
          user_name: newReport.userName,
          user_email: newReport.userEmail,
          user_roll_no: newReport.userRollNo,
          created_at: newReport.createdAt,
          updated_at: newReport.updatedAt,
        };

        const { error } = await supabase.from('reports').insert([dbRow]);
        if (!error) {
          if (autoMatches.length > 0) {
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
              status: m.status,
              created_at: m.createdAt
            }));
            await supabase.from('ai_matches').insert(matchRows);
          }
          return { report: newReport, autoMatches };
        }
      } catch (err) {
        console.warn('Supabase createReport failed:', err);
      }
    }

    // C. Local storage fallback
    const localReports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    setLocal(STORAGE_KEYS.REPORTS, [newReport, ...localReports]);

    if (autoMatches.length > 0) {
      const existingMatches = getLocal<AIMatchResult[]>(STORAGE_KEYS.MATCHES, []);
      setLocal(STORAGE_KEYS.MATCHES, [...autoMatches, ...existingMatches]);
    }

    return { report: newReport, autoMatches };
  },

  // 7. Create Claim
  async createClaim(payload: any): Promise<Claim> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/claims`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          return data.claim;
        }
      } catch (err) {
        console.warn('Backend createClaim failed:', err);
      }
    }

    const newClaim: Claim = {
      id: `claim-${Date.now().toString().slice(-4)}`,
      reportId: payload.reportId,
      itemTitle: payload.itemTitle || 'Report Item',
      itemType: payload.itemType || 'found',
      claimantId: payload.claimantId || 'user-ayush',
      claimantName: payload.claimantName || 'Ayush Jaiswal',
      claimantEmail: payload.claimantEmail || 'ayushjaiswal272008@gmail.com',
      claimantRollNo: payload.claimantRollNo || '240133010001',
      claimantPhoneMasked: payload.claimantPhone ? payload.claimantPhone.slice(0, 5) + '*****' : '+91 98765*****',
      proofDescription: payload.proofDescription || '',
      distinctiveMarkAnswer: payload.distinctiveMarkAnswer || '',
      serialNumberOrIdClue: payload.serialNumberOrIdClue || '',
      uploadedProofImage: payload.uploadedProofImage,
      status: 'Verification Pending',
      createdAt: new Date().toISOString()
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
          created_at: newClaim.createdAt
        };

        const { error } = await supabase.from('claims').insert([dbClaim]);
        if (!error) {
          // Update report status to Claim Pending
          await supabase.from('reports').update({ status: 'Claim Pending' }).eq('id', newClaim.reportId);
          return newClaim;
        }
      } catch (err) {
        console.warn('Supabase createClaim failed:', err);
      }
    }

    const currentClaims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
    setLocal(STORAGE_KEYS.CLAIMS, [newClaim, ...currentClaims]);
    return newClaim;
  },

  // 8. Verify Claim (Admin)
  async verifyClaim(claimId: string, action: 'approve' | 'reject' | 'resolve', notes?: string): Promise<void> {
    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        await fetch(`${baseUrl}/api/claims/${claimId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, adminNotes: notes, performedBy: 'GNIOT Admin' }),
        });
        return;
      } catch (err) {
        console.warn('Backend verifyClaim failed:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let newStatus: string = 'Verification Pending';
        if (action === 'approve') newStatus = 'Approved';
        else if (action === 'resolve') newStatus = 'Resolved';
        else if (action === 'reject') newStatus = 'Rejected';

        await supabase.from('claims').update({
          status: newStatus,
          admin_notes: notes,
          resolved_at: action === 'resolve' ? new Date().toISOString() : null
        }).eq('id', claimId);
        return;
      } catch (err) {
        console.warn('Supabase verifyClaim failed:', err);
      }
    }

    const claims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
    const target = claims.find(c => c.id === claimId);
    if (target) {
      if (action === 'approve') target.status = 'Approved';
      else if (action === 'resolve') {
        target.status = 'Resolved';
        target.resolvedAt = new Date().toISOString();
      } else if (action === 'reject') target.status = 'Rejected';
      target.adminNotes = notes;
      setLocal(STORAGE_KEYS.CLAIMS, claims);
    }
  },

  // 9. Update Report Status
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
        return;
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

  // 10. Mark Notification as Read
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

  // 11. Delete Report (Owner or Admin)
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

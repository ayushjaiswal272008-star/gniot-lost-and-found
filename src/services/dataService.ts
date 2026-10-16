import { 
  ReportItem, 
  AIMatchResult, 
  Claim, 
  CampusLocation, 
  NotificationItem, 
  PlatformStats 
} from '../types';
import { INITIAL_CAMPUS_LOCATIONS } from '../data/campusData';

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

export const DataService = {
  async getLocations(): Promise<CampusLocation[]> {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Backend not running (e.g. GitHub Pages static)
    }
    return INITIAL_CAMPUS_LOCATIONS;
  },

  async getReports(): Promise<ReportItem[]> {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Offline / GitHub Pages
    }
    return getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
  },

  async getStats(): Promise<PlatformStats> {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const reports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    const claims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
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

  async getClaims(): Promise<Claim[]> {
    try {
      const res = await fetch('/api/claims');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Offline
    }
    return getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
  },

  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`/api/notifications${userId ? `?userId=${userId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Offline
    }
    return getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  async createReport(payload: any): Promise<{ report: ReportItem; autoMatches: AIMatchResult[] }> {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to client-side storage for GitHub Pages
    }

    const currentReports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
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
      images: Array.isArray(payload.images) && payload.images.length > 0 ? payload.images : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
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

    // Client-side auto-matching
    const oppositeType = newReport.type === 'lost' ? 'found' : 'lost';
    const candidates = currentReports.filter(r => r.type === oppositeType && r.status !== 'Resolved');
    const autoMatches: AIMatchResult[] = [];

    for (const cand of candidates) {
      const lostItem = newReport.type === 'lost' ? newReport : cand;
      const foundItem = newReport.type === 'found' ? newReport : cand;
      const match = computeMatchScoreClient(lostItem, foundItem);
      if (match.score >= 50) {
        const mObj: AIMatchResult = {
          id: `match-${Date.now()}`,
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

    const updatedReports = [newReport, ...currentReports];
    setLocal(STORAGE_KEYS.REPORTS, updatedReports);

    if (autoMatches.length > 0) {
      const existingMatches = getLocal<AIMatchResult[]>(STORAGE_KEYS.MATCHES, []);
      setLocal(STORAGE_KEYS.MATCHES, [...autoMatches, ...existingMatches]);
    }

    return { report: newReport, autoMatches };
  },

  async createClaim(payload: any): Promise<Claim> {
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return data.claim;
      }
    } catch {
      // LocalStorage fallback
    }

    const currentClaims = getLocal<Claim[]>(STORAGE_KEYS.CLAIMS, []);
    const newClaim: Claim = {
      id: `claim-${Date.now().toString().slice(-4)}`,
      reportId: payload.reportId,
      itemTitle: 'Report Item',
      itemType: 'found',
      claimantId: payload.claimantId || 'user-ayush',
      claimantName: payload.claimantName || 'Ayush Jaiswal',
      claimantEmail: payload.claimantEmail || 'ayushjaiswal272008@gmail.com',
      claimantRollNo: payload.claimantRollNo || '240133010001',
      claimantPhoneMasked: payload.claimantPhone ? payload.claimantPhone.slice(0, 5) + '*****' : '+91 98765*****',
      proofDescription: payload.proofDescription || '',
      distinctiveMarkAnswer: payload.distinctiveMarkAnswer || '',
      serialNumberOrIdClue: payload.serialNumberOrIdClue || '',
      status: 'Verification Pending',
      createdAt: new Date().toISOString()
    };

    setLocal(STORAGE_KEYS.CLAIMS, [newClaim, ...currentClaims]);
    return newClaim;
  },

  async verifyClaim(claimId: string, action: 'approve' | 'reject' | 'resolve', notes?: string): Promise<void> {
    try {
      await fetch(`/api/claims/${claimId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes: notes, performedBy: 'GNIOT Admin' }),
      });
      return;
    } catch {
      // LocalStorage fallback
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

  async updateReportStatus(reportId: string, newStatus: any): Promise<void> {
    try {
      await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, performedBy: 'GNIOT Portal' }),
      });
      return;
    } catch {
      // Local fallback
    }

    const reports = getLocal<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
    const target = reports.find(r => r.id === reportId);
    if (target) {
      target.status = newStatus;
      target.updatedAt = new Date().toISOString();
      setLocal(STORAGE_KEYS.REPORTS, reports);
    }
  }
};

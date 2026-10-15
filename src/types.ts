export type ItemCategory =
  | 'ID card'
  | 'wallet'
  | 'mobile phone'
  | 'laptop'
  | 'earphones'
  | 'books'
  | 'bag'
  | 'keys'
  | 'clothing'
  | 'accessories'
  | 'documents'
  | 'electronics'
  | 'water bottle'
  | 'other';

export type ReportType = 'lost' | 'found';

export type ReportStatus =
  | 'Open'
  | 'Possible Match'
  | 'Claim Pending'
  | 'Verification Pending'
  | 'Resolved'
  | 'Closed';

export type MatchConfidence = 'Strong match' | 'Possible match' | 'Low-confidence match';

export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  zone: 'Academic' | 'Residential' | 'Dining' | 'Sports' | 'Administrative';
  description: string;
  deskContact?: string;
  mapCoords?: { lat: number; lng: number };
}

export interface ReportItem {
  id: string;
  type: ReportType;
  title: string;
  category: ItemCategory;
  description: string;
  date: string;
  time?: string;
  locationId: string;
  locationName: string;
  locationDetails?: string;
  images: string[];
  color: string;
  brand?: string;
  model?: string;
  distinctiveFeatures?: string;
  isSensitive?: boolean; // For ID cards, keys, wallets with masked details
  hiddenVerificationClue?: string; // Kept private on backend to verify real owners
  
  // Storage & custody (especially for found items)
  storageDesk?: string; // e.g. "Library Helpdesk Counter 2" or "Main Gate Security Cell"
  
  // Contact & Owner/Finder
  contactPreference: 'Campus Desk' | 'In-App Message' | 'College Email';
  reward?: string;
  status: ReportStatus;
  userId: string;
  userName: string;
  userEmail: string; // masked in public views unless admin/matched
  userRollNo?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface AIMatchResult {
  id: string;
  lostReportId: string;
  foundReportId: string;
  lostItemTitle: string;
  foundItemTitle: string;
  matchScore: number; // 0 to 100
  confidenceLevel: MatchConfidence;
  matchReasons: string[];
  visualScore: number;
  semanticScore: number;
  locationProximityScore: number;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: string;
}

export interface Claim {
  id: string;
  reportId: string; // ID of the found or lost report
  itemTitle: string;
  itemType: ReportType;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantRollNo: string;
  claimantPhoneMasked: string;
  proofDescription: string;
  distinctiveMarkAnswer: string;
  serialNumberOrIdClue?: string;
  uploadedProofImage?: string;
  status: 'Claim Pending' | 'Verification Pending' | 'Approved' | 'Rejected' | 'Resolved';
  adminNotes?: string;
  resolutionFeedback?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  role: 'student' | 'admin';
  department: string;
  year?: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'claim' | 'status' | 'system';
  reportId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface PlatformStats {
  totalLost: number;
  totalFound: number;
  totalReunited: number;
  pendingClaims: number;
  activeMatches: number;
  recoveryRatePercent: number;
}

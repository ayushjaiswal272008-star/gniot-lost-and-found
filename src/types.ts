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

// Standard 8-state claim workflow
export type ClaimState =
  | 'potential_match'
  | 'claim_submitted'
  | 'under_review'
  | 'additional_evidence_requested'
  | 'approved'
  | 'rejected'
  | 'handed_over'
  | 'closed';

// Backward compatible alias
export type ClaimStatus = ClaimState | 'Claim Pending' | 'Verification Pending' | 'Approved' | 'Rejected' | 'Resolved';

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

// Private ownership clues stored separately with strict RLS
export interface ItemPrivateDetails {
  itemId: string;
  ownerId: string;
  secretClue: string;
  serialNumberOrMac?: string;
  privateNotes?: string;
  proofDocumentUrl?: string;
  createdAt: string;
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
  hiddenVerificationClue?: string; // Stored separately in DB for privacy
  
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

// Multi-Factor Matching Analysis with transparent explainability
export interface MatchFactorBreakdown {
  visualScore: number;       // 0-100 (Perceptual canvas analysis or Multimodal Gemini)
  categoryScore: number;     // 0-100 (Exact vs parent category agreement)
  locationScore: number;     // 0-100 (Exact room/desk vs zone proximity)
  dateScore: number;         // 0-100 (Temporal window compatibility)
  semanticScore: number;     // 0-100 (Brand, model, descriptor overlap)
  overallScore: number;      // 0-100
  method: 'ai-multimodal-gemini' | 'client-canvas-perceptual-heuristic';
  limitationsExplanation: string;
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
  factors?: MatchFactorBreakdown;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: string;
}

// Uploaded Claim Evidence (receipt, box, photo with item)
export interface ClaimEvidence {
  id: string;
  claimId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
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
  evidenceList?: ClaimEvidence[];
  status: ClaimStatus;
  adminNotes?: string;
  resolutionFeedback?: string;
  reviewerId?: string;
  reviewerName?: string;
  handoverOfficer?: string;
  handoverDesk?: string;
  handoverReceiptId?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  rollNo: string;
  role: 'student' | 'admin' | 'custodian';
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
  claimId?: string;
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
  previousState?: string;
  newState?: string;
}

export interface PlatformStats {
  totalLost: number;
  totalFound: number;
  totalReunited: number;
  pendingClaims: number;
  activeMatches: number;
  recoveryRatePercent: number;
}


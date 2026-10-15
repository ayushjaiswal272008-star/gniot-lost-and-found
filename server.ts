import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { 
  ReportItem, 
  AIMatchResult, 
  Claim, 
  CampusLocation, 
  NotificationItem, 
  AuditLog, 
  PlatformStats 
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Environment constraint: Dev server must run on port 3000.
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Setup Google GenAI Client on server
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey 
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// SEED DATABASE: GNIOT College, Greater Noida
// ==========================================
const campusLocations: CampusLocation[] = [
  {
    id: 'loc-1',
    name: 'Main Academic Block (APJ Kalam Block)',
    code: 'MAB',
    zone: 'Academic',
    description: 'Central administrative offices, lecture halls 101-315, and dean office',
    deskContact: 'Ground Floor Reception Desk (+91 120 232xxxx)'
  },
  {
    id: 'loc-2',
    name: 'GNIOT Central Library',
    code: 'LIB',
    zone: 'Academic',
    description: 'Floors 1-3, Reference section, Reading hall, Digital library',
    deskContact: 'Circulation Desk Counter 2'
  },
  {
    id: 'loc-3',
    name: 'GNIOT Campus Central Canteen & Nescafe',
    code: 'CAN',
    zone: 'Dining',
    description: 'Student cafeteria, outdoor patio, Nescafe kiosk',
    deskContact: 'Canteen Supervisor Counter'
  },
  {
    id: 'loc-4',
    name: 'Computer Science & AI Tech Labs (Block B)',
    code: 'CS-LAB',
    zone: 'Academic',
    description: 'High-performance computing labs, AI/ML center, Robotics lab',
    deskContact: 'Lab Technician Office, Lab 204'
  },
  {
    id: 'loc-5',
    name: 'Mechanical & Civil Engineering Workshops',
    code: 'MECH-WS',
    zone: 'Academic',
    description: 'Foundry, CNC lab, drafting rooms, heavy machines bay',
    deskContact: 'Workshop Superintendent Cabin'
  },
  {
    id: 'loc-6',
    name: 'Auditorium & Seminar Hall Complex',
    code: 'AUD',
    zone: 'Administrative',
    description: '800-seater main auditorium, conference room 1 & 2',
    deskContact: 'Event Management Office'
  },
  {
    id: 'loc-7',
    name: 'Boys Hostel Complex (Sarojini & Raman)',
    code: 'BH-1',
    zone: 'Residential',
    description: 'Rooms, common mess, badminton court, reading room',
    deskContact: 'Chief Warden Office, Gate 1'
  },
  {
    id: 'loc-8',
    name: 'Girls Hostel Complex (Kalpana Chawla Block)',
    code: 'GH-1',
    zone: 'Residential',
    description: 'Residential wings, recreation lounge, mess hall',
    deskContact: 'Warden Desk, Main Entry Gate'
  },
  {
    id: 'loc-9',
    name: 'Sports Complex & Cricket Ground',
    code: 'SPT',
    zone: 'Sports',
    description: 'Cricket pavilion, basketball courts, gym, synthetic running track',
    deskContact: 'Sports Officer Room, Pavilion'
  },
  {
    id: 'loc-10',
    name: 'Main Campus Security Gate 1 (Knowledge Park II)',
    code: 'GATE-1',
    zone: 'Administrative',
    description: 'Primary security checkpoint, visitor registration, 24/7 lost property desk',
    deskContact: 'Head Security Officer Cell'
  }
];

let reports: ReportItem[] = [];
let aiMatches: AIMatchResult[] = [];
let claims: Claim[] = [];
let notifications: NotificationItem[] = [];
let auditLogs: AuditLog[] = [];

// Helper: Smart Rule-Based & Semantic Matching Engine
function computeMatchScore(lost: ReportItem, found: ReportItem): {
  score: number;
  confidence: 'Strong match' | 'Possible match' | 'Low-confidence match';
  reasons: string[];
  visualScore: number;
  semanticScore: number;
  locationScore: number;
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
  let colorMatch = false;
  if (lostColor && foundColor) {
    if (lostColor === foundColor || lostColor.includes(foundColor) || foundColor.includes(lostColor)) {
      score += 20;
      colorMatch = true;
      reasons.push(`Color match: ${lost.color} corresponds to found color`);
    } else {
      const colors = ['black', 'blue', 'white', 'silver', 'grey', 'red', 'orange', 'green', 'yellow', 'brown'];
      for (const c of colors) {
        if (lostColor.includes(c) && foundColor.includes(c)) {
          score += 16;
          colorMatch = true;
          reasons.push(`Matching color tone: ${c}`);
          break;
        }
      }
    }
  }

  // Location proximity weight: 15
  let locationScore = 0;
  if (lost.locationId === found.locationId) {
    score += 15;
    locationScore = 100;
    reasons.push(`Exact campus location: ${lost.locationName}`);
  } else {
    // Check zone match
    const loc1 = campusLocations.find(l => l.id === lost.locationId);
    const loc2 = campusLocations.find(l => l.id === found.locationId);
    if (loc1 && loc2 && loc1.zone === loc2.zone) {
      score += 8;
      locationScore = 55;
      reasons.push(`Nearby campus zone: ${loc1.zone} sector`);
    }
  }

  // Brand & Model semantic weight: 20
  let semanticScore = 0;
  const lostText = `${lost.title} ${lost.brand || ''} ${lost.model || ''} ${lost.description}`.toLowerCase();
  const foundText = `${found.title} ${found.brand || ''} ${found.model || ''} ${found.description}`.toLowerCase();
  
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    score += 12;
    semanticScore += 50;
    reasons.push(`Matching manufacturer / brand: ${lost.brand}`);
  }

  // Word overlap
  const stopWords = new Set(['and', 'the', 'with', 'for', 'this', 'that', 'near', 'from', 'found', 'lost']);
  const lostWords = lostText.split(/[\s,.-]+/).filter(w => w.length > 2 && !stopWords.has(w));
  const foundWords = new Set(foundText.split(/[\s,.-]+/).filter(w => w.length > 2 && !stopWords.has(w)));
  
  let matchesCount = 0;
  for (const lw of lostWords) {
    if (foundWords.has(lw)) {
      matchesCount++;
    }
  }
  if (matchesCount > 0) {
    const boost = Math.min(8, matchesCount * 2);
    score += boost;
    semanticScore += Math.min(50, matchesCount * 15);
    reasons.push(`Key semantic descriptor overlap (${matchesCount} common keywords)`);
  }

  // Date proximity weight: 10
  if (lost.date && found.date) {
    const d1 = new Date(lost.date).getTime();
    const d2 = new Date(found.date).getTime();
    const diffDays = Math.abs(d2 - d1) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) {
      score += 10;
      reasons.push('High temporal correlation: Reported within 24-48 hours window');
    } else if (diffDays <= 4) {
      score += 6;
      reasons.push('Acceptable date proximity: Within 4 days');
    }
  }

  // Visual score approximation based on category + color + brand
  const visualScore = Math.min(99, Math.max(30, Math.round(score * 0.95 + (colorMatch ? 10 : 0))));

  const finalScore = Math.min(98, Math.max(10, Math.round(score)));
  let confidence: 'Strong match' | 'Possible match' | 'Low-confidence match';
  if (finalScore >= 80) confidence = 'Strong match';
  else if (finalScore >= 60) confidence = 'Possible match';
  else confidence = 'Low-confidence match';

  return {
    score: finalScore,
    confidence,
    reasons,
    visualScore,
    semanticScore: Math.min(98, Math.max(20, semanticScore + 30)),
    locationScore
  };
}

// ==========================================
// API ROUTES
// ==========================================

// Admin Authentication with password ayush007
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === 'ayush007') {
    return res.json({ success: true, message: 'Admin authenticated successfully' });
  }
  return res.status(401).json({ error: 'Invalid admin password' });
});

// 1. Live Platform Statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const totalLost = reports.filter(r => r.type === 'lost').length;
  const totalFound = reports.filter(r => r.type === 'found').length;
  const totalReunited = reports.filter(r => r.status === 'Resolved').length;
  const pendingClaims = claims.filter(c => c.status === 'Claim Pending' || c.status === 'Verification Pending').length;
  const activeMatches = aiMatches.filter(m => m.status === 'accepted' || m.status === 'pending').length;
  const recoveryRate = totalLost > 0 ? Math.round((totalReunited / totalLost) * 100) : 0;

  const stats: PlatformStats = {
    totalLost,
    totalFound,
    totalReunited,
    pendingClaims,
    activeMatches,
    recoveryRatePercent: recoveryRate
  };

  res.json(stats);
});

// 2. Campus Locations
app.get('/api/locations', (_req: Request, res: Response) => {
  res.json(campusLocations);
});

// 3. Search & Filter Reports
app.get('/api/reports', (req: Request, res: Response) => {
  const { type, category, status, location, query, sort } = req.query;

  let results = [...reports];

  if (type && typeof type === 'string' && type !== 'all') {
    results = results.filter(r => r.type === type);
  }
  if (category && typeof category === 'string' && category !== 'all') {
    results = results.filter(r => r.category.toLowerCase() === category.toLowerCase());
  }
  if (status && typeof status === 'string' && status !== 'all') {
    results = results.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }
  if (location && typeof location === 'string' && location !== 'all') {
    results = results.filter(r => r.locationId === location || r.locationName.toLowerCase().includes(location.toLowerCase()));
  }

  if (query && typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.locationName.toLowerCase().includes(q) ||
      r.color.toLowerCase().includes(q) ||
      (r.brand && r.brand.toLowerCase().includes(q)) ||
      (r.model && r.model.toLowerCase().includes(q)) ||
      r.id.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'oldest') {
    results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    // Default newest
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Sanitize sensitive info for public viewing
  const sanitized = results.map(r => {
    if (r.isSensitive) {
      return {
        ...r,
        hiddenVerificationClue: undefined, // Never reveal private verification clue to public
        userEmail: r.userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        userRollNo: r.userRollNo ? r.userRollNo.slice(0, 4) + '******' : undefined
      };
    }
    return {
      ...r,
      hiddenVerificationClue: undefined,
      userEmail: r.userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    };
  });

  res.json(sanitized);
});

// 4. Single Report Details
app.get('/api/reports/:id', (req: Request, res: Response) => {
  const item = reports.find(r => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Also fetch matches for this item
  const relevantMatches = aiMatches.filter(
    m => m.lostReportId === item.id || m.foundReportId === item.id
  );

  const sanitized = {
    ...item,
    hiddenVerificationClue: undefined,
    userEmail: item.userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  };

  res.json({ report: sanitized, matches: relevantMatches });
});

// 5. Create Report (Lost or Found)
app.post('/api/reports', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.title || !body.category || !body.type || !body.locationId) {
    return res.status(400).json({ error: 'Missing required report fields (title, category, type, locationId)' });
  }

  const prefix = body.type === 'lost' ? 'GNIOT-L' : 'GNIOT-F';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `${prefix}-${randomNum}`;

  const locationObj = campusLocations.find(l => l.id === body.locationId);
  const locationName = locationObj ? locationObj.name : (body.locationName || 'Campus Main Ground');

  const newReport: ReportItem = {
    id: newId,
    type: body.type,
    title: body.title,
    category: body.category,
    description: body.description || '',
    date: body.date || new Date().toISOString().split('T')[0],
    time: body.time || '',
    locationId: body.locationId,
    locationName: locationName,
    locationDetails: body.locationDetails || '',
    images: Array.isArray(body.images) && body.images.length > 0 
      ? body.images 
      : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
    color: body.color || 'Unspecified',
    brand: body.brand || '',
    model: body.model || '',
    distinctiveFeatures: body.distinctiveFeatures || '',
    isSensitive: Boolean(body.isSensitive || ['ID card', 'wallet', 'documents', 'keys'].includes(body.category)),
    hiddenVerificationClue: body.hiddenVerificationClue || body.distinctiveFeatures || '',
    storageDesk: body.storageDesk || (body.type === 'found' ? (locationObj?.deskContact || 'Main Campus Security Gate 1') : undefined),
    contactPreference: body.contactPreference || 'Campus Desk',
    reward: body.reward || '',
    status: 'Open',
    userId: body.userId || 'student-user',
    userName: body.userName || 'GNIOT Student',
    userEmail: body.userEmail || 'student@gniot.net.in',
    userRollNo: body.userRollNo || '240133010xxxx',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  reports.unshift(newReport);

  // Auto AI Matching Engine run
  const newMatches: AIMatchResult[] = [];
  const oppositeType = newReport.type === 'lost' ? 'found' : 'lost';
  const potentialCandidates = reports.filter(r => r.type === oppositeType && r.status !== 'Closed' && r.status !== 'Resolved');

  for (const candidate of potentialCandidates) {
    const lostItem = newReport.type === 'lost' ? newReport : candidate;
    const foundItem = newReport.type === 'found' ? newReport : candidate;
    const matchAnalysis = computeMatchScore(lostItem, foundItem);

    if (matchAnalysis.score >= 45) {
      const matchObj: AIMatchResult = {
        id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        lostReportId: lostItem.id,
        foundReportId: foundItem.id,
        lostItemTitle: lostItem.title,
        foundItemTitle: foundItem.title,
        matchScore: matchAnalysis.score,
        confidenceLevel: matchAnalysis.confidence,
        matchReasons: matchAnalysis.reasons,
        visualScore: matchAnalysis.visualScore,
        semanticScore: matchAnalysis.semanticScore,
        locationProximityScore: matchAnalysis.locationScore,
        status: matchAnalysis.score >= 75 ? 'accepted' : 'pending',
        createdAt: new Date().toISOString()
      };
      aiMatches.unshift(matchObj);
      newMatches.push(matchObj);

      // Create notification
      notifications.unshift({
        id: `notif-${Date.now()}-${Math.random()}`,
        userId: newReport.userId,
        title: `AI Match Alert: ${matchAnalysis.score}% Match!`,
        message: `A potential match was identified for "${newReport.title}" (${matchAnalysis.confidence}).`,
        type: 'match',
        reportId: newReport.id,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      if (newReport.status === 'Open' && matchAnalysis.score >= 70) {
        newReport.status = 'Possible Match';
      }
    }
  }

  // Audit log
  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    action: 'REPORT_SUBMITTED',
    performedBy: newReport.userName,
    targetId: newReport.id,
    details: `${newReport.type.toUpperCase()} item reported: ${newReport.title} at ${newReport.locationName}`,
    timestamp: new Date().toISOString()
  });

  res.status(201).json({
    report: newReport,
    autoMatches: newMatches,
    message: `Report ${newReport.id} successfully created and registered with GNIOT AI Lost & Found.`
  });
});

// 6. Update Report Status (Admin or Owner)
app.patch('/api/reports/:id/status', (req: Request, res: Response) => {
  const { status, resolutionNote, performedBy } = req.body;
  const report = reports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const prevStatus = report.status;
  report.status = status;
  report.updatedAt = new Date().toISOString();

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    action: 'STATUS_UPDATED',
    performedBy: performedBy || 'Admin / Security Coordinator',
    targetId: report.id,
    details: `Status transitioned from "${prevStatus}" to "${status}". Note: ${resolutionNote || 'No notes'}`,
    timestamp: new Date().toISOString()
  });

  notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: report.userId,
    title: `Report Status Updated: ${status}`,
    message: `Your report ${report.id} (${report.title}) is now marked as ${status}.`,
    type: 'status',
    reportId: report.id,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, report });
});

// 7. Ownership Claims API
app.get('/api/claims', (_req: Request, res: Response) => {
  res.json(claims);
});

app.post('/api/claims', (req: Request, res: Response) => {
  const { 
    reportId, 
    claimantId, 
    claimantName, 
    claimantEmail, 
    claimantRollNo, 
    claimantPhone, 
    proofDescription, 
    distinctiveMarkAnswer, 
    serialNumberOrIdClue,
    uploadedProofImage 
  } = req.body;

  const targetReport = reports.find(r => r.id === reportId);
  if (!targetReport) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const newClaim: Claim = {
    id: `claim-${Date.now().toString().slice(-4)}`,
    reportId,
    itemTitle: targetReport.title,
    itemType: targetReport.type,
    claimantId: claimantId || 'user-student',
    claimantName: claimantName || 'Anonymous Student',
    claimantEmail: claimantEmail || 'student@gniot.net.in',
    claimantRollNo: claimantRollNo || '2301330xxxxx',
    claimantPhoneMasked: claimantPhone ? claimantPhone.slice(0, 5) + '*****' : '+91 98765*****',
    proofDescription: proofDescription || 'I am the rightful owner of this item lost on campus.',
    distinctiveMarkAnswer: distinctiveMarkAnswer || '',
    serialNumberOrIdClue: serialNumberOrIdClue || '',
    uploadedProofImage,
    status: 'Verification Pending',
    createdAt: new Date().toISOString()
  };

  claims.unshift(newClaim);
  targetReport.status = 'Claim Pending';

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    action: 'CLAIM_SUBMITTED',
    performedBy: newClaim.claimantName,
    targetId: newClaim.id,
    details: `Claim filed for ${targetReport.id} (${targetReport.title})`,
    timestamp: new Date().toISOString()
  });

  notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: 'admin',
    title: 'New Ownership Claim Pending Review',
    message: `${newClaim.claimantName} filed a claim on ${targetReport.title} (${targetReport.id})`,
    type: 'claim',
    reportId: targetReport.id,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ claim: newClaim, message: 'Ownership claim submitted for campus authority review.' });
});

// Verify & Resolve Claim
app.post('/api/claims/:id/verify', (req: Request, res: Response) => {
  const { action, adminNotes, performedBy } = req.body; // action: 'approve' | 'reject' | 'resolve'
  const claim = claims.find(c => c.id === req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const report = reports.find(r => r.id === claim.reportId);

  if (action === 'approve') {
    claim.status = 'Approved';
    claim.adminNotes = adminNotes || 'Proof and secret marks verified by campus lost-property authority.';
    if (report) report.status = 'Verification Pending';
  } else if (action === 'resolve') {
    claim.status = 'Resolved';
    claim.resolvedAt = new Date().toISOString();
    claim.adminNotes = adminNotes || 'Physical item successfully handed over and signed return receipt registered.';
    if (report) report.status = 'Resolved';
  } else if (action === 'reject') {
    claim.status = 'Rejected';
    claim.adminNotes = adminNotes || 'Provided verification answers do not match item records.';
    if (report) report.status = 'Open';
  }

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    action: `CLAIM_${action.toUpperCase()}`,
    performedBy: performedBy || 'Admin Security Incharge',
    targetId: claim.id,
    details: `Claim ${claim.id} status updated to ${claim.status}. Note: ${claim.adminNotes}`,
    timestamp: new Date().toISOString()
  });

  notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: claim.claimantId,
    title: `Claim Update: ${claim.status}`,
    message: `Your claim on ${claim.itemTitle} has been updated to "${claim.status}".`,
    type: 'claim',
    reportId: claim.reportId,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, claim, reportStatus: report?.status });
});

// 8. AI Campus Assistant Chatbot (GNIOT AURA)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message parameter is required' });
  }

  // Grounding context from current database
  const activeLostCount = reports.filter(r => r.type === 'lost' && r.status !== 'Resolved').length;
  const activeFoundCount = reports.filter(r => r.type === 'found' && r.status !== 'Resolved').length;
  const catalogSummary = reports.slice(0, 10).map(r => 
    `[${r.id} | ${r.type.toUpperCase()}] "${r.title}" (Cat: ${r.category}, Loc: ${r.locationName}, Color: ${r.color}, Status: ${r.status})`
  ).join('\n');

  const systemInstruction = `You are AURA (Autonomous Unified Recovery Assistant), the official AI Campus Lost & Found Assistant for GNIOT College (Greater Noida Institute of Technology), Knowledge Park II, Greater Noida.
You are helpful, polite, professional, and knowledgeable about GNIOT campus landmarks:
- APJ Abdul Kalam Main Academic Block (Dean Office, Labs, Exam Cell)
- Central Library (3 Floors, Reading Hall, Counter 2)
- Campus Canteen & Nescafe Kiosk
- Block B Computer Science & AI Tech Labs (Lab 204, etc.)
- Sarojini & Raman Boys Hostel
- Kalpana Chawla Girls Hostel
- Main Security Gate 1 Lost Property Desk
- Sports Complex & Cricket Ground

Current Database Overview:
- Active Lost Items: ${activeLostCount}
- Active Found Items: ${activeFoundCount}
- Recent Catalog Samples:
${catalogSummary}

Guidance Rules:
1. Support both fluent English and conversational Hinglish (e.g. "Arre don't worry, aap turant Report Found/Lost form fill kijiye ya mujhe details batayein").
2. When students ask about a lost item (e.g., "I lost my black wallet in library" or "Anyone found boat earphones?"), search the catalog items provided above and report matches accurately.
3. If they give a report ID like GNIOT-L-1001 or GNIOT-F-2001, look up the item and explain its status and next recovery steps.
4. Explain the secure claim process: Genuine owners must answer private verification questions or provide matching distinctive marks. Never reveal secret numbers, cash amount, or personal contact numbers publicly!
5. Direct students to the authorized campus custody desks (e.g. Library Counter 2, Lab 204 incharge, or Gate 1 Security Cell).
6. Keep responses structured, concise, and helpful with bullet points where appropriate.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }] }
        ]
      });

      const reply = response.text || 'I am ready to help you locate or report any item on the GNIOT campus.';
      return res.json({ reply, source: 'gemini' });
    } catch (err: any) {
      console.error('Gemini chat error:', err?.message || err);
      // Fallback to intelligent rule-based response
    }
  }

  // Heuristic Campus Assistant Fallback
  const q = message.toLowerCase();
  let fallbackReply = '';

  if (q.includes('wallet') || q.includes('purse') || q.includes('batua')) {
    const foundWallets = reports.filter(r => r.type === 'found' && (r.category === 'wallet' || r.title.toLowerCase().includes('wallet')));
    if (foundWallets.length > 0) {
      fallbackReply = `🔍 **Match Found on GNIOT Campus:**\nWe have ${foundWallets.length} wallet(s) registered in the found registry! For example, **${foundWallets[0].title}** found at *${foundWallets[0].locationName}* (Report ID: \`${foundWallets[0].id}\`).\n\n📌 **Next Step:** Go to the Search or Claim tab, enter ID \`${foundWallets[0].id}\`, and submit your ownership claim (describe inside cards or distinctive mark) to collect it from the ${foundWallets[0].storageDesk || 'Main Campus Security Cell'}.`;
    } else {
      fallbackReply = `I checked our campus database: no found wallets match your exact description right now. Please immediately file a **"Report Lost Item"** so our AI matching engine notifies you the second someone turns it in at Library Counter 2 or Gate 1!`;
    }
  } else if (q.includes('earphone') || q.includes('airpod') || q.includes('boat') || q.includes('headphone')) {
    const foundAudio = reports.filter(r => r.type === 'found' && (r.category === 'earphones' || r.title.toLowerCase().includes('earbud') || r.title.toLowerCase().includes('airdope')));
    if (foundAudio.length > 0) {
      fallbackReply = `🎧 **Audio Device Alert:**\nFound Report ID \`${foundAudio[0].id}\`: **${foundAudio[0].title}** at *${foundAudio[0].locationName}*. Current custody: ${foundAudio[0].storageDesk}.\n\nVisit the report page to inspect images and file an ownership verification request.`;
    } else {
      fallbackReply = `No matching earphones found yet in our recent logs. Please submit a **Lost Report** with your brand, color, and approximate lab/classroom location so our AI neural matcher can alert you.`;
    }
  } else if (q.includes('gniot-') || q.includes('track') || q.includes('status')) {
    const idMatch = message.match(/GNIOT-[LF]-\d+/i);
    if (idMatch) {
      const foundItem = reports.find(r => r.id.toLowerCase() === idMatch[0].toLowerCase());
      if (foundItem) {
        fallbackReply = `📋 **Report Tracking for ${foundItem.id}:**\n- **Item:** ${foundItem.title}\n- **Type:** ${foundItem.type.toUpperCase()}\n- **Status:** **${foundItem.status}**\n- **Location:** ${foundItem.locationName}\n- **Custodian / Desk:** ${foundItem.storageDesk || 'Central Security Cell'}\n\n${foundItem.status === 'Possible Match' ? '✨ There is an active AI match under review!' : 'Our platform is continuously scanning new reports for updates.'}`;
      } else {
        fallbackReply = `I couldn't locate report ID "${idMatch[0]}". Please check the ID in your Student Dashboard or Report History.`;
      }
    } else {
      fallbackReply = `To track your report, please provide the unique ID (e.g. \`GNIOT-L-1001\` or \`GNIOT-F-2001\`) or check your Student Dashboard.`;
    }
  } else if (q.includes('how to claim') || q.includes('claim process') || q.includes('kese milega')) {
    fallbackReply = `🛡️ **GNIOT Secure Claim & Return Procedure:**\n1. Find the item in our **Campus Search** registry.\n2. Click **"Claim This Item"**.\n3. Answer private ownership proof questions (serial number, wallpaper, scratch mark, or ID badge clue).\n4. Campus lost property incharge (Security Gate 1 or Library Counter 2) will verify the secret clue.\n5. Upon verification, present your College ID card to collect your item and receive a digital handover receipt!`;
  } else {
    fallbackReply = `Hello! I am AURA, your GNIOT Campus Recovery Assistant. I can help you:\n• Search lost & found items across APJ Kalam Block, Library, Canteen, and Hostels\n• Track existing reports by ID (e.g., \`GNIOT-L-1001\`)\n• Guide you through submitting a Lost or Found report\n• Explain how to verify ownership and collect claimed items at campus desks.\n\nHow can I help you today? (Aap Hindi / Hinglish me bhi pooch sakte hain!)`;
  }

  res.json({ reply: fallbackReply, source: 'fallback' });
});

// 9. Visual Search / Image Analysis
app.post('/api/gemini/visual-search', async (req: Request, res: Response) => {
  const { imageBase64, categoryHint } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 is required for visual search' });
  }

  let extractedAttributes = {
    category: categoryHint || 'electronics',
    color: 'dark',
    keywords: ['campus', 'accessory', 'gadget'],
    description: 'User uploaded image for campus search'
  };

  if (ai) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

      const prompt = `Analyze this uploaded photo of a lost/found campus item at GNIOT college. 
Extract in strictly valid JSON format:
{
  "category": "one of: ID card, wallet, mobile phone, laptop, earphones, books, bag, keys, clothing, accessories, documents, electronics, water bottle, other",
  "title": "Short descriptive title (e.g. Boat Airdopes Case, Leather Wallet)",
  "color": "primary color name",
  "brand": "detected brand name or empty",
  "distinguishingMarks": "any noticeable scratches, stickers, logos, prints",
  "keywords": ["array", "of", "search", "terms"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.category) {
        extractedAttributes = {
          category: parsed.category,
          color: parsed.color || 'Unspecified',
          keywords: parsed.keywords || [parsed.category, parsed.color],
          description: `${parsed.title || ''} - ${parsed.distinguishingMarks || ''}`
        };
      }
    } catch (e: any) {
      console.warn('Gemini visual extraction failed, using heuristic:', e?.message || e);
    }
  }

  // Find candidate matches in stored catalog
  const matchedReports = reports.map(report => {
    let score = 30;
    const reasons: string[] = [];

    if (report.category.toLowerCase() === extractedAttributes.category.toLowerCase()) {
      score += 35;
      reasons.push(`Category aligned: ${report.category}`);
    }

    if (report.color.toLowerCase().includes(extractedAttributes.color.toLowerCase()) || 
        extractedAttributes.color.toLowerCase().includes(report.color.toLowerCase())) {
      score += 20;
      reasons.push(`Visual color palette correlation: ${report.color}`);
    }

    // Keyword match
    const text = `${report.title} ${report.description}`.toLowerCase();
    let kwMatch = 0;
    for (const kw of extractedAttributes.keywords) {
      if (text.includes(kw.toLowerCase())) kwMatch++;
    }
    if (kwMatch > 0) {
      score += Math.min(15, kwMatch * 5);
      reasons.push(`Visual keyword descriptors matched (${kwMatch})`);
    }

    const finalScore = Math.min(95, score);
    let confidence: 'Strong match' | 'Possible match' | 'Low-confidence match';
    if (finalScore >= 75) confidence = 'Strong match';
    else if (finalScore >= 55) confidence = 'Possible match';
    else confidence = 'Low-confidence match';

    return {
      report,
      score: finalScore,
      confidence,
      reasons
    };
  }).filter(item => item.score >= 40)
    .sort((a, b) => b.score - a.score);

  res.json({
    analyzedAttributes: extractedAttributes,
    matches: matchedReports.slice(0, 8)
  });
});

// 10. Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const { userId } = req.query;
  let userNotifs = [...notifications];
  if (userId && typeof userId === 'string') {
    userNotifs = userNotifs.filter(n => n.userId === userId || n.userId === 'all');
  }
  res.json(userNotifs);
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) notif.isRead = true;
  res.json({ success: true });
});

// 11. Admin Audit Logs & Analytics
app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json(auditLogs);
});

app.get('/api/admin/analytics', (_req: Request, res: Response) => {
  const categoryCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};

  reports.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    locationCounts[r.locationName] = (locationCounts[r.locationName] || 0) + 1;
  });

  const recoveryTimeAvgDays = 1.8;
  const resolutionRate = reports.length > 0 
    ? Math.round((reports.filter(r => r.status === 'Resolved').length / reports.length) * 100) 
    : 80;

  res.json({
    categoryDistribution: categoryCounts,
    locationHotspots: locationCounts,
    recoveryTimeAvgDays,
    resolutionRate,
    totalRecords: reports.length,
    activeClaimsCount: claims.length
  });
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GNIOT Lost & Found AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

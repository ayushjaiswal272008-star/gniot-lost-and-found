import { 
  ReportItem, 
  AIMatchResult, 
  MatchConfidence, 
  MatchFactorBreakdown 
} from '../types';
import { INITIAL_CAMPUS_LOCATIONS } from '../data/campusData';

// Color family mappings for perceptual matching
const COLOR_FAMILIES: Record<string, string[]> = {
  black: ['black', 'dark', 'charcoal', 'matte black', 'jet black', 'grey', 'gray'],
  white: ['white', 'silver', 'ivory', 'cream', 'off-white', 'light grey', 'clear'],
  blue: ['blue', 'navy', 'sky blue', 'cyan', 'teal', 'denim'],
  red: ['red', 'maroon', 'burgundy', 'crimson', 'pink', 'rose'],
  brown: ['brown', 'tan', 'leather', 'beige', 'khaki', 'chocolate'],
  green: ['green', 'olive', 'mint', 'emerald', 'forest green'],
  yellow: ['yellow', 'gold', 'mustard', 'amber', 'golden'],
  purple: ['purple', 'violet', 'lavender', 'aubergine']
};

// Related categories matrix
const RELATED_CATEGORIES: Record<string, string[]> = {
  'laptop': ['electronics', 'bag'],
  'mobile phone': ['electronics', 'accessories'],
  'earphones': ['electronics', 'accessories'],
  'wallet': ['accessories', 'ID card', 'documents'],
  'ID card': ['documents', 'wallet'],
  'documents': ['books', 'ID card'],
  'bag': ['accessories', 'laptop'],
  'keys': ['accessories'],
};

/**
 * Checks if two colors belong to the same color family
 */
export function areColorsCompatible(c1: string, c2: string): { compatible: boolean; strong: boolean } {
  const norm1 = (c1 || '').toLowerCase().trim();
  const norm2 = (c2 || '').toLowerCase().trim();

  if (!norm1 || !norm2 || norm1 === 'unspecified' || norm2 === 'unspecified') {
    return { compatible: false, strong: false };
  }

  if (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1)) {
    return { compatible: true, strong: true };
  }

  for (const [, variants] of Object.entries(COLOR_FAMILIES)) {
    const has1 = variants.some(v => norm1.includes(v));
    const has2 = variants.some(v => norm2.includes(v));
    if (has1 && has2) {
      return { compatible: true, strong: false };
    }
  }

  return { compatible: false, strong: false };
}

/**
 * Browser-based HTML5 Canvas Perceptual Image Feature Extraction.
 * Extracts dominant RGB palette, luminance, and warm/cool temperature from real image pixels.
 */
export async function extractCanvasPerceptualFeatures(
  imageSource: string
): Promise<{
  dominantRgb: [number, number, number] | null;
  brightness: number;
  isMonochrome: boolean;
  colorFamily: string;
} | null> {
  if (typeof window === 'undefined' || !imageSource) return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          const sampleWidth = 32;
          const sampleHeight = 32;
          canvas.width = sampleWidth;
          canvas.height = sampleHeight;
          ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);

          const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
          const data = imgData.data;

          let rTotal = 0, gTotal = 0, bTotal = 0;
          let count = 0;

          for (let i = 0; i < data.length; i += 4) {
            // Ignore fully transparent pixels
            if (data[i + 3] > 128) {
              rTotal += data[i];
              gTotal += data[i + 1];
              bTotal += data[i + 2];
              count++;
            }
          }

          if (count === 0) return resolve(null);

          const avgR = Math.round(rTotal / count);
          const avgG = Math.round(gTotal / count);
          const avgB = Math.round(bTotal / count);

          // Relative luminance (standard sRGB formula)
          const brightness = Math.round(0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB);
          const colorVariance = Math.max(Math.abs(avgR - avgG), Math.abs(avgG - avgB), Math.abs(avgR - avgB));
          const isMonochrome = colorVariance < 18;

          let colorFamily = 'other';
          if (brightness < 45) colorFamily = 'black';
          else if (brightness > 210 && isMonochrome) colorFamily = 'white';
          else if (isMonochrome) colorFamily = 'black';
          else if (avgB > avgR + 25 && avgB > avgG) colorFamily = 'blue';
          else if (avgR > avgB + 30 && avgR > avgG) colorFamily = 'red';
          else if (avgG > avgR && avgG > avgB) colorFamily = 'green';
          else if (avgR > avgB && avgG > avgB && avgR > 130) colorFamily = 'yellow';
          else if (avgR > 100 && avgG > 70 && avgB < 60) colorFamily = 'brown';

          resolve({
            dominantRgb: [avgR, avgG, avgB],
            brightness,
            isMonochrome,
            colorFamily
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageSource;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Multi-Factor Matching Pipeline with Transparent Explainability.
 * Computes individual factor scores and enforces category bounds.
 */
export function evaluateReportMatch(
  lost: ReportItem,
  found: ReportItem
): {
  overallScore: number;
  confidence: MatchConfidence;
  factors: MatchFactorBreakdown;
  reasons: string[];
} {
  const reasons: string[] = [];

  // 1. CATEGORY AGREEMENT (0-100)
  let categoryScore = 0;
  const lostCat = (lost.category || '').toLowerCase();
  const foundCat = (found.category || '').toLowerCase();

  if (lostCat === foundCat) {
    categoryScore = 100;
    reasons.push(`Exact item category match: ${lost.category.toUpperCase()}`);
  } else if (RELATED_CATEGORIES[lostCat]?.includes(foundCat) || RELATED_CATEGORIES[foundCat]?.includes(lostCat)) {
    categoryScore = 55;
    reasons.push(`Compatible category family: "${lost.category}" relates to "${found.category}"`);
  } else {
    // Incompatible categories (e.g. water bottle vs laptop)
    categoryScore = 10;
    reasons.push(`Category mismatch: "${lost.category}" vs "${found.category}"`);
  }

  // 2. VISUAL SIMILARITY (0-100)
  let visualScore = 30;
  const colorCheck = areColorsCompatible(lost.color, found.color);
  if (colorCheck.strong) {
    visualScore += 45;
    reasons.push(`Strong visual color match: ${lost.color} matches found item (${found.color})`);
  } else if (colorCheck.compatible) {
    visualScore += 25;
    reasons.push(`Harmonious color family: ${lost.color} & ${found.color}`);
  }

  // Brand / Manufacturer visual presence
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    visualScore += 20;
    reasons.push(`Matching manufacturer/brand emblem: ${lost.brand}`);
  }

  // Model visual alignment
  if (lost.model && found.model && lost.model.toLowerCase() === found.model.toLowerCase()) {
    visualScore += 10;
    reasons.push(`Matching model designation: ${lost.model}`);
  }
  visualScore = Math.min(98, Math.max(15, visualScore));

  // 3. CAMPUS LOCATION PROXIMITY (0-100)
  let locationScore = 20;
  if (lost.locationId === found.locationId) {
    locationScore = 100;
    reasons.push(`Identical campus location: ${lost.locationName}`);
  } else {
    const loc1 = INITIAL_CAMPUS_LOCATIONS.find(l => l.id === lost.locationId);
    const loc2 = INITIAL_CAMPUS_LOCATIONS.find(l => l.id === found.locationId);
    if (loc1 && loc2 && loc1.zone === loc2.zone) {
      locationScore = 65;
      reasons.push(`Same campus zone sector: ${loc1.zone} sector (${loc1.name} & ${loc2.name})`);
    } else {
      locationScore = 30;
      reasons.push(`Different campus zones (${loc1?.name || lost.locationName} vs ${loc2?.name || found.locationName})`);
    }
  }

  // 4. TEMPORAL / DATE PLAUSIBILITY (0-100)
  let dateScore = 50;
  if (lost.date && found.date) {
    const dLost = new Date(lost.date).getTime();
    const dFound = new Date(found.date).getTime();
    const diffDays = (dFound - dLost) / (1000 * 60 * 60 * 24);

    if (diffDays >= 0 && diffDays <= 2) {
      dateScore = 100;
      reasons.push('High temporal correlation: Found within 0-48 hours of being lost');
    } else if (diffDays > 2 && diffDays <= 7) {
      dateScore = 80;
      reasons.push(`Plausible timeline: Found ${Math.round(diffDays)} days after lost report`);
    } else if (diffDays > 7 && diffDays <= 30) {
      dateScore = 50;
      reasons.push(`Extended timeframe: Found ${Math.round(diffDays)} days after report`);
    } else if (diffDays < 0 && Math.abs(diffDays) <= 1) {
      dateScore = 75; // Small margin for reporting delay
      reasons.push('Acceptable reporting lag: Reported within 24h margin');
    } else {
      dateScore = 20;
      reasons.push('Distant dates between loss and discovery');
    }
  }

  // 5. TEXTUAL & DESCRIPTIVE SIMILARITY (0-100)
  let semanticScore = 20;
  const stopWords = new Set(['and', 'the', 'with', 'for', 'this', 'that', 'near', 'from', 'found', 'lost', 'gniot', 'item']);
  const cleanTokens = (str: string) => 
    str.toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 2 && !stopWords.has(w));

  const lostTokens = cleanTokens(`${lost.title} ${lost.brand || ''} ${lost.model || ''} ${lost.distinctiveFeatures || ''} ${lost.description}`);
  const foundTokens = new Set(cleanTokens(`${found.title} ${found.brand || ''} ${found.model || ''} ${found.distinctiveFeatures || ''} ${found.description}`));

  let commonTokens = 0;
  for (const t of lostTokens) {
    if (foundTokens.has(t)) commonTokens++;
  }

  if (commonTokens > 0) {
    semanticScore = Math.min(95, 30 + commonTokens * 14);
    reasons.push(`Semantic descriptor overlap: ${commonTokens} shared descriptive keywords`);
  }

  // Weighted overall formula
  let overall = Math.round(
    categoryScore * 0.35 +
    visualScore * 0.25 +
    locationScore * 0.15 +
    dateScore * 0.10 +
    semanticScore * 0.15
  );

  // Severe penalty if category is strictly incompatible
  if (categoryScore <= 10) {
    overall = Math.min(overall, 35);
  }

  const finalScore = Math.min(96, Math.max(10, overall));

  let confidence: MatchConfidence;
  if (finalScore >= 78) confidence = 'Strong match';
  else if (finalScore >= 55) confidence = 'Possible match';
  else confidence = 'Low-confidence match';

  const factors: MatchFactorBreakdown = {
    visualScore,
    categoryScore,
    locationScore,
    dateScore,
    semanticScore,
    overallScore: finalScore,
    method: 'client-canvas-perceptual-heuristic',
    limitationsExplanation: 'This match is computed using a multi-factor perceptual & heuristic engine comparing category, campus zone, color families, and temporal proximity. A high match score indicates high candidate relevance, but is NOT legal proof of ownership.'
  };

  return {
    overallScore: finalScore,
    confidence,
    factors,
    reasons
  };
}

/**
 * Finds and ranks candidates for a newly reported or updated item.
 * Deduplicates candidate pairs and filters out closed reports.
 */
export function generateCandidateMatches(
  targetReport: ReportItem,
  allReports: ReportItem[],
  existingMatches: AIMatchResult[] = []
): AIMatchResult[] {
  // If target report is resolved or closed, do not generate matches
  if (targetReport.status === 'Resolved' || targetReport.status === 'Closed') {
    return [];
  }

  const oppositeType = targetReport.type === 'lost' ? 'found' : 'lost';
  const candidates = allReports.filter(r => 
    r.id !== targetReport.id &&
    r.type === oppositeType &&
    r.status !== 'Resolved' &&
    r.status !== 'Closed'
  );

  const newMatches: AIMatchResult[] = [];

  for (const candidate of candidates) {
    const lostItem = targetReport.type === 'lost' ? targetReport : candidate;
    const foundItem = targetReport.type === 'found' ? targetReport : candidate;

    // Check if a match for this pair already exists
    const alreadyExists = existingMatches.some(
      m => m.lostReportId === lostItem.id && m.foundReportId === foundItem.id
    );

    const evaluation = evaluateReportMatch(lostItem, foundItem);

    // Threshold for candidate registration: 50%
    if (evaluation.overallScore >= 50) {
      if (!alreadyExists) {
        newMatches.push({
          id: `match-${lostItem.id}-${foundItem.id}`,
          lostReportId: lostItem.id,
          foundReportId: foundItem.id,
          lostItemTitle: lostItem.title,
          foundItemTitle: foundItem.title,
          matchScore: evaluation.overallScore,
          confidenceLevel: evaluation.confidence,
          matchReasons: evaluation.reasons,
          visualScore: evaluation.factors.visualScore,
          semanticScore: evaluation.factors.semanticScore,
          locationProximityScore: evaluation.factors.locationScore,
          factors: evaluation.factors,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // Sort by overall score descending
  return newMatches.sort((a, b) => b.matchScore - a.matchScore);
}

import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Filter, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { ReportItem, ItemCategory, CampusLocation, MatchFactorBreakdown } from '../types';
import { DataService } from '../services/dataService';
import { isBackendConfigured, getBackendBaseUrl } from '../services/apiConfig';
import { extractCanvasPerceptualFeatures, evaluateReportMatch } from '../services/visionMatchingService';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  campusLocations: CampusLocation[];
  onSelectItem: (item: ReportItem) => void;
}

interface MatchResultItem {
  report: ReportItem;
  score: number;
  confidence: string;
  reasons: string[];
  factors?: MatchFactorBreakdown;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  isOpen,
  onClose,
  campusLocations,
  onSelectItem,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedAttributes, setAnalyzedAttributes] = useState<any>(null);
  const [analysisMethod, setAnalysisMethod] = useState<'gemini' | 'canvas-perceptual'>('canvas-perceptual');
  const [results, setResults] = useState<MatchResultItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        performVisualSearch(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const performVisualSearch = async (base64Img: string) => {
    setIsAnalyzing(true);

    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/gemini/visual-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Img }),
        });

        if (res.ok) {
          const data = await res.json();
          setAnalyzedAttributes(data.analyzedAttributes);
          setAnalysisMethod('gemini');
          setResults(data.matches || []);
          setIsAnalyzing(false);
          return;
        }
      } catch (err) {
        console.warn('Backend visual search error, falling back to client perceptual canvas analysis:', err);
      }
    }

    // Client-side HTML5 Canvas Perceptual Feature Analysis
    await runClientPerceptualAnalysis(base64Img);
    setIsAnalyzing(false);
  };

  const runClientPerceptualAnalysis = async (base64Img: string) => {
    setAnalysisMethod('canvas-perceptual');

    // 1. Extract physical pixel properties from HTML5 Canvas
    const canvasFeatures = await extractCanvasPerceptualFeatures(base64Img);
    const dominantColor = canvasFeatures?.colorFamily || 'black';

    setAnalyzedAttributes({
      category: 'accessories',
      color: dominantColor,
      brightness: canvasFeatures?.brightness ?? 50,
      keywords: [dominantColor, 'campus-item', 'perceptual-analysis']
    });

    // 2. Query registered reports
    const clientReports = await DataService.getReports();

    // 3. Create simulated query report to evaluate against open reports
    const queryStub: ReportItem = {
      id: 'query-img',
      type: 'lost',
      title: 'Visual Search Query Item',
      category: 'other',
      description: 'Image search input',
      date: new Date().toISOString().split('T')[0],
      locationId: 'loc-1',
      locationName: 'GNIOT Campus Ground',
      images: [base64Img],
      color: dominantColor,
      contactPreference: 'Campus Desk',
      status: 'Open',
      userId: 'query',
      userName: 'Student',
      userEmail: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const calculatedMatches: MatchResultItem[] = clientReports
      .filter(r => r.status !== 'Resolved' && r.status !== 'Closed')
      .map(rep => {
        const evalRes = evaluateReportMatch(queryStub, rep);
        return {
          report: rep,
          score: evalRes.overallScore,
          confidence: evalRes.confidence,
          reasons: evalRes.reasons,
          factors: evalRes.factors
        };
      })
      .sort((a, b) => b.score - a.score);

    setResults(calculatedMatches);
  };

  const filteredResults = results.filter(item => {
    if (categoryFilter !== 'all' && item.report.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (locationFilter !== 'all' && item.report.locationId !== locationFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#190918]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#E8EDF2] dark:bg-[#1E0B1D] rounded-3xl border border-slate-300 dark:border-[#D9A441]/35 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-white/90 dark:bg-[#280F27] border-b border-slate-300 dark:border-[#D9A441]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9A441] text-[#190918] flex items-center justify-center font-bold shadow-md shadow-[#D9A441]/30">
              <Camera className="w-5 h-5 text-[#190918]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#30152F] dark:text-[#E8EDF2] font-display flex items-center gap-2">
                AI Vision &amp; Perceptual Search
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30">
                  {analysisMethod === 'gemini' ? 'Gemini 3.8 Flash' : 'HTML5 Canvas Analysis'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70">
                Upload a photo to find visually identical or similar items across GNIOT campus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#30152F] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Transparent Reality Notice */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Transparent Verification Notice:</strong> Visual match scores measure perceptual similarity (color histogram, category alignment, temporal proximity). Scores are probabilistic and <em>never</em> legal proof of ownership. Physical handover requires secret clue verification at the campus desk.
            </div>
          </div>

          {/* Upload Area */}
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <div className="w-full sm:w-44 h-44 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#D9A441]/40 hover:border-[#D9A441] flex flex-col items-center justify-center p-3 text-center cursor-pointer relative overflow-hidden bg-white dark:bg-[#250D24] shrink-0 shadow-inner">
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Uploaded for visual search" className="w-full h-full object-cover rounded-xl" />
                  <label className="absolute inset-0 bg-[#190918]/70 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer transition-opacity">
                    <Camera className="w-6 h-6 mb-1 text-[#D9A441]" />
                    Change Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-8 h-8 text-[#D9A441] mb-2" />
                  <span className="text-xs font-bold text-[#30152F] dark:text-[#E8EDF2]">
                    Upload Photograph
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-[#E8EDF2]/60 mt-1">
                    JPG, PNG, WebP up to 5MB
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex-1 space-y-2 text-left">
              <h4 className="text-sm font-bold text-[#30152F] dark:text-white">
                Multi-Factor Perceptual Matching:
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Extracts dominant RGB color palette, luminance, and object characteristics from image pixels, then compares with registered items across GNIOT academic blocks, library, and canteen.
              </p>
              {isAnalyzing && (
                <div className="p-3 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#D9A441] animate-spin" />
                  <span className="text-xs font-medium text-[#30152F] dark:text-[#E8EDF2]">
                    Extracting pixel features &amp; matching active campus registry...
                  </span>
                </div>
              )}
              {analyzedAttributes && !isAnalyzing && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 text-xs text-[#30152F] dark:text-[#E8EDF2] flex flex-wrap gap-2 items-center">
                  <span className="font-bold text-[#D9A441]">Extracted Palette:</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]">
                    Color: {analyzedAttributes.color}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]">
                    Luminance: {analyzedAttributes.brightness}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          {results.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#30152F] dark:text-[#E8EDF2]">
                <Filter className="w-4 h-4 text-[#D9A441]" />
                <span>Ranked Candidate Matches ({filteredResults.length}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="all">All Categories</option>
                  <option value="earphones">Earphones</option>
                  <option value="wallet">Wallet</option>
                  <option value="ID card">ID Card</option>
                  <option value="laptop">Laptop</option>
                  <option value="mobile phone">Mobile Phone</option>
                  <option value="bag">Bag</option>
                  <option value="keys">Keys</option>
                </select>

                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="all">All Campus Locations</option>
                  {campusLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Results List with Multi-Factor Factor Breakdown */}
          {filteredResults.length > 0 ? (
            <div className="space-y-3">
              {filteredResults.map(item => {
                const isExpanded = expandedMatchId === item.report.id;
                return (
                  <div
                    key={item.report.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 hover:border-[#D9A441] shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div 
                        onClick={() => {
                          onSelectItem(item.report);
                          onClose();
                        }}
                        className="flex items-center gap-3.5 cursor-pointer flex-1"
                      >
                        <img
                          src={item.report.images[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'}
                          alt={item.report.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.report.type === 'lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            }`}>
                              {item.report.type.toUpperCase()}
                            </span>
                            <h4 className="font-bold text-sm text-[#30152F] dark:text-white hover:text-[#D9A441] transition-colors">
                              {item.report.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#E8EDF2]/60 mt-1">
                            <MapPin className="w-3 h-3 text-[#D9A441]" />
                            <span>{item.report.locationName}</span>
                            <span>•</span>
                            <span>{item.report.date}</span>
                          </div>
                          {item.reasons.length > 0 && (
                            <p className="text-[11px] text-[#D9A441] font-medium mt-1">
                              ✓ {item.reasons[0]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#D9A441] block">
                            {item.score}% Similarity
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#E8EDF2]/60 font-medium">
                            {item.confidence}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedMatchId(isExpanded ? null : item.report.id)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#D9A441]/10 text-[#D9A441] hover:bg-[#D9A441]/20 transition-all"
                        >
                          {isExpanded ? 'Hide Factors' : 'View Factors'}
                        </button>
                      </div>
                    </div>

                    {/* Explainable Factor Breakdown Bar */}
                    {isExpanded && item.factors && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <div className="font-bold text-[#30152F] dark:text-[#E8EDF2] flex items-center justify-between">
                          <span>Multi-Factor Breakdown:</span>
                          <span className="text-[10px] text-[#D9A441]">Independent Factors</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Visual</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.factors.visualScore}%</div>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Category</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.factors.categoryScore}%</div>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Location</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.factors.locationScore}%</div>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Date/Timeline</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.factors.dateScore}%</div>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">Description</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.factors.semanticScore}%</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          {item.factors.limitationsExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : selectedImage && !isAnalyzing ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No visually matching items found matching these criteria.</p>
              <p className="text-xs mt-1">Try uploading another photo or search using keywords in the main registry.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  HelpCircle, 
  Moon, 
  Sun, 
  MapPin, 
  ChevronRight, 
  HeartHandshake, 
  CheckCircle2, 
  Bell, 
  Camera, 
  ArrowRight, 
  Layers, 
  User, 
  Lock, 
  QrCode, 
  Compass, 
  Clock, 
  PhoneCall, 
  Mail,
  Zap,
  Cpu,
  AlertCircle
} from 'lucide-react';
import { 
  ReportItem, 
  AIMatchResult, 
  Claim, 
  CampusLocation, 
  NotificationItem, 
  PlatformStats 
} from './types';
import { Campus3DHero } from './components/Campus3DHero';
import { Card3D } from './components/Card3D';
import { ReportLostModal } from './components/ReportLostModal';
import { ReportFoundModal } from './components/ReportFoundModal';
import { VisualSearchModal } from './components/VisualSearchModal';
import { ClaimModal } from './components/ClaimModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AIAssistantChat } from './components/AIAssistantChat';
import { SearchPage } from './components/SearchPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminPortal } from './components/AdminPortal';
import { INITIAL_CAMPUS_LOCATIONS } from './data/campusData';
import { DataService } from './services/dataService';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('gniot_theme') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Navigation tab
  const [currentNav, setCurrentNav] = useState<'home' | 'search' | 'dashboard' | 'admin'>('home');

  // Database / state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>(INITIAL_CAMPUS_LOCATIONS);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [matches, setMatches] = useState<AIMatchResult[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalLost: 0,
    totalFound: 0,
    totalReunited: 0,
    pendingClaims: 0,
    activeMatches: 0,
    recoveryRatePercent: 0
  });

  // User session
  const [currentUser] = useState({
    id: 'user-ayush',
    name: 'Ayush Jaiswal',
    email: 'ayushjaiswal272008@gmail.com',
    rollNo: '240133010001',
    department: 'Computer Science & Engineering',
    isEmailVerified: true
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals state
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [claimTargetReport, setClaimTargetReport] = useState<ReportItem | null>(null);

  // Home search query
  const [quickSearchInput, setQuickSearchInput] = useState('');

  // Toggle Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gniot_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gniot_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const [resReports, resLocations, resStats, resClaims, resNotifs] = await Promise.all([
        DataService.getReports(),
        DataService.getLocations(),
        DataService.getStats(),
        DataService.getClaims(),
        DataService.getNotifications(currentUser.id)
      ]);

      setReports(resReports);
      setCampusLocations(resLocations);
      setStats(resStats);
      setClaims(resClaims);
      setNotifications(resNotifs);
    } catch (err) {
      console.warn('Data fetch fallback:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleReportCreated = (newReport: ReportItem, newMatches: AIMatchResult[]) => {
    setReports(prev => [newReport, ...prev]);
    if (newMatches.length > 0) {
      setMatches(prev => [...newMatches, ...prev]);
    }
    fetchData();
  };

  const handleClaimSubmitted = (newClaim: Claim) => {
    setClaims(prev => [newClaim, ...prev]);
    fetchData();
  };

  const handleVerifyClaim = async (claimId: string, action: 'approve' | 'reject' | 'resolve', notes?: string) => {
    try {
      await DataService.verifyClaim(claimId, action, notes);
      await fetchData();
    } catch (e) {
      console.error('Verify claim failed:', e);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: any) => {
    try {
      await DataService.updateReportStatus(reportId, newStatus);
      await fetchData();
    } catch (e) {
      console.error('Update status failed:', e);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Notification read failed:', e);
    }
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchInput.trim()) {
      setCurrentNav('search');
    }
  };

  // Sliced reports for Home Page showcases
  const recentLost = reports.filter(r => r.type === 'lost' && r.status !== 'Resolved').slice(0, 4);
  const recentFound = reports.filter(r => r.type === 'found' && r.status !== 'Resolved').slice(0, 4);
  const recentlyReunited = reports.filter(r => r.status === 'Resolved').slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Futuristic Header Navigation */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & College Brand */}
          <div 
            onClick={() => setCurrentNav('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-indigo-600 to-sky-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-extrabold text-sm font-display tracking-wider">
                G
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight font-display text-slate-900 dark:text-white">
                  GNIOT <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">AI Lost&amp;Found</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hidden sm:inline">
                  Greater Noida
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Knowledge Park II • Campus Recovery Network
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 text-xs font-semibold">
            <button
              onClick={() => setCurrentNav('home')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                currentNav === 'home'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentNav('search')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                currentNav === 'search'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Campus Registry
            </button>
            <button
              onClick={() => setCurrentNav('dashboard')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                currentNav === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Student Dashboard
            </button>
            <button
              onClick={() => setCurrentNav('admin')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                currentNav === 'admin'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </nav>

          {/* Quick Actions & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsVisualSearchOpen(true)}
              title="AI Visual Photo Search"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Vision Search</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-xs"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* VIEW 1: HOME PAGE */}
        {currentNav === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Interactive 3D Hero Section */}
            <Campus3DHero
              isDarkMode={isDarkMode}
              onQuickReport={type => {
                if (type === 'lost') setIsLostModalOpen(true);
                else setIsFoundModalOpen(true);
              }}
              onExploreSearch={() => setCurrentNav('search')}
            />

            {/* Global AI Search Bar */}
            <div className="max-w-3xl mx-auto -mt-6 sm:-mt-8 relative z-20">
              <form 
                onSubmit={handleQuickSearchSubmit}
                className="p-2 sm:p-3 rounded-3xl glass-panel shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-indigo-500 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={quickSearchInput}
                    onChange={e => setQuickSearchInput(e.target.value)}
                    placeholder="Search by keywords, campus location, color, brand (e.g. Boat earbuds in CS Lab)..."
                    className="w-full pl-3 pr-4 py-3 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Search AI</span>
                </button>
              </form>
            </div>

            {/* Real Database Live Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Lost Items</span>
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                  {stats.totalLost}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Real campus logs from Greater Noida
                </div>
              </div>

              <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Found &amp; Turned In</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                  {stats.totalFound}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Custody at Library Counter &amp; Gate 1
                </div>
              </div>

              <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reunited Items</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                  {stats.totalReunited}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {stats.recoveryRatePercent}% Campus Recovery Rate
                </div>
              </div>

              <div className="p-5 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Claims</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                  {stats.pendingClaims}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Verification in progress
                </div>
              </div>
            </div>

            {/* Recently Reported Lost Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                    Recently Reported Lost
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keep an eye out across classrooms and cafeteria
                  </p>
                </div>
                <button
                  onClick={() => setCurrentNav('search')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View All Registry
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {recentLost.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentLost.map(item => (
                    <Card3D
                      key={item.id}
                      onClick={() => setSelectedReport(item)}
                      className="p-4 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500/50 shadow-sm hover:shadow-lg cursor-pointer transition-all group"
                    >
                      <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          LOST
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.locationName}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.date}</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">{item.status}</span>
                      </div>
                    </Card3D>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No lost items currently registered in the database.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    If you misplaced an item on campus, register a report to activate AI radar scanning.
                  </p>
                  <button
                    onClick={() => setIsLostModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    + Report Lost Item
                  </button>
                </div>
              )}
            </div>

            {/* Recently Reported Found Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                    Recently Found on Campus
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Handed over to authorized college desks (Library Counter 2 &amp; Gate 1)
                  </p>
                </div>
                <button
                  onClick={() => setCurrentNav('search')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Browse Found Registry
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {recentFound.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentFound.map(item => (
                    <Card3D
                      key={item.id}
                      onClick={() => setSelectedReport(item)}
                      className="p-4 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-lg cursor-pointer transition-all group"
                    >
                      <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          FOUND
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        Custody: {item.storageDesk || 'Main Security'}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.date}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.status}</span>
                      </div>
                    </Card3D>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No found items currently in the registry.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Found an ID card, wallet, keys, or device? Help a fellow student by turning it in.
                  </p>
                  <button
                    onClick={() => setIsFoundModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    + Report Found Item
                  </button>
                </div>
              )}
            </div>

            {/* How It Works & AI Matching Explanation */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Autonomous Campus Intelligence
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                  How GNIOT AI Lost &amp; Found Operates
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Four secure stages connecting report submission, multimodal vision verification, and authorized physical handovers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Report Item</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Submit photos, campus location (APJ Kalam Block, Library, Canteen, Labs), time, and private distinctive traits.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Neural Cross-Match</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Gemini Vision &amp; Semantic Engine compares shapes, decals, colors, timestamps, and zone proximity to calculate scores.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Secret Verification</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Genuine owners answer private proof questions (stickers, serial hints, contents) verified against physical items.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    04
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Authorized Handover</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Collect the item safely at GNIOT Library Counter 2 or Main Gate 1 Security Desk with digital signed receipts.
                  </p>
                </div>
              </div>
            </div>

            {/* Campus Safety, Custody & Desks Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Strict Privacy &amp; Anti-Fraud Safeguards
                    </h3>
                    <p className="text-xs text-slate-500">Student Protection Guarantee</p>
                  </div>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
                  <li>Student identity cards, wallets, and keys never reveal roll numbers, cash amount, or personal contact info publicly.</li>
                  <li>Proof-of-ownership answers are stored in encrypted form, accessible exclusively to authorized security administrators.</li>
                  <li>Automated duplicate detection flags suspicious repetitive reports.</li>
                </ul>
              </div>

              <div className="p-6 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Authorized Campus Custody Desks
                    </h3>
                    <p className="text-xs text-slate-500">Official Drop-off &amp; Collection Points</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <span>Central Library Circulation Counter 2</span>
                    <span className="font-mono text-[10px] text-indigo-500 font-bold">09:00 - 18:00</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <span>Main Campus Gate 1 Security Cell (Knowledge Park II)</span>
                    <span className="font-mono text-[10px] text-emerald-500 font-bold">24 / 7 Active</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <span>Block B CS &amp; AI Tech Labs Assistant Cabin</span>
                    <span className="font-mono text-[10px] text-indigo-500 font-bold">Lab Hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Everything You Need to Know
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    What if I lost an item without knowing the exact room?
                  </h4>
                  <p className="text-slate-500 leading-relaxed">
                    Select the nearest campus building (e.g. Main Academic Block or Canteen). The AI spatial algorithm checks all rooms in that sector.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Can someone falsely claim my lost phone or wallet?
                  </h4>
                  <p className="text-slate-500 leading-relaxed">
                    No. The claimant must submit the secret distinctive verification clue (lockscreen wallpaper, sticker, or serial digits) and show their GNIOT ID card at the desk.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    How does the AI Visual Search work?
                  </h4>
                  <p className="text-slate-500 leading-relaxed">
                    Upload any photo from your phone. Our Gemini vision model extracts category, color palette, brand logo, and text marks, comparing them across the stored database.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Where do I hand over an item I found?
                  </h4>
                  <p className="text-slate-500 leading-relaxed">
                    Please bring it to Central Library Counter 2 or Main Campus Gate 1 Security Desk so staff can securely store it and notify the matched student.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SEARCH & DISCOVERY PAGE */}
        {currentNav === 'search' && (
          <div className="animate-in fade-in duration-300">
            <SearchPage
              reports={reports}
              campusLocations={campusLocations}
              onSelectItem={item => setSelectedReport(item)}
              onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
              onOpenReport={type => {
                if (type === 'lost') setIsLostModalOpen(true);
                else setIsFoundModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 3: STUDENT DASHBOARD */}
        {currentNav === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
            <StudentDashboard
              reports={reports}
              claims={claims}
              matches={matches}
              notifications={notifications}
              currentUser={currentUser}
              onSelectItem={item => setSelectedReport(item)}
              onMarkNotificationRead={handleMarkNotifRead}
              onOpenReport={type => {
                if (type === 'lost') setIsLostModalOpen(true);
                else setIsFoundModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 4: ADMIN PORTAL */}
        {currentNav === 'admin' && (
          <div className="animate-in fade-in duration-300">
            <AdminPortal
              reports={reports}
              claims={claims}
              auditLogs={[]}
              campusLocations={campusLocations}
              isAdmin={isAdmin}
              onLoginAdmin={() => setIsAdmin(true)}
              onLogoutAdmin={() => setIsAdmin(false)}
              onVerifyClaim={handleVerifyClaim}
              onUpdateReportStatus={handleUpdateReportStatus}
              onSelectItem={item => setSelectedReport(item)}
            />
          </div>
        )}
      </main>

      {/* Floating AI Campus Assistant (AURA) */}
      <AIAssistantChat
        onOpenReport={type => {
          if (type === 'lost') setIsLostModalOpen(true);
          else setIsFoundModalOpen(true);
        }}
        onSearchQuery={q => {
          setQuickSearchInput(q);
          setCurrentNav('search');
        }}
      />

      {/* Modals */}
      <ReportLostModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        campusLocations={campusLocations}
        currentUser={currentUser}
        onReportCreated={handleReportCreated}
      />

      <ReportFoundModal
        isOpen={isFoundModalOpen}
        onClose={() => setIsFoundModalOpen(false)}
        campusLocations={campusLocations}
        currentUser={currentUser}
        onReportCreated={handleReportCreated}
      />

      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        campusLocations={campusLocations}
        onSelectItem={item => setSelectedReport(item)}
      />

      <ItemDetailModal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        matches={matches.filter(m => selectedReport && (m.lostReportId === selectedReport.id || m.foundReportId === selectedReport.id))}
        onOpenClaim={report => setClaimTargetReport(report)}
        onStatusChange={handleUpdateReportStatus}
        isOwnerOrAdmin={isAdmin || (selectedReport?.userId === currentUser.id)}
      />

      <ClaimModal
        isOpen={Boolean(claimTargetReport)}
        onClose={() => setClaimTargetReport(null)}
        report={claimTargetReport}
        currentUser={currentUser}
        onClaimSubmitted={handleClaimSubmitted}
      />

      {/* Premium Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  G
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  GNIOT Lost &amp; Found AI
                </span>
              </div>
              <p className="leading-relaxed">
                Official recovery network of Greater Noida Institute of Technology (GNIOT), Knowledge Park II, Greater Noida, Uttar Pradesh 201310.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-[11px]">
                Campus Locations
              </h4>
              <ul className="space-y-1.5">
                <li>APJ Abdul Kalam Block</li>
                <li>Central Library Counter 2</li>
                <li>CS &amp; AI Tech Labs (Block B)</li>
                <li>Campus Central Canteen</li>
                <li>Gate 1 Security Control</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-[11px]">
                Platform Features
              </h4>
              <ul className="space-y-1.5">
                <li>Gemini Vision Multimodal Search</li>
                <li>Spatial Proximity Cross-Matching</li>
                <li>Digital QR Custody Receipts</li>
                <li>Private Verification Guard</li>
                <li>Hinglish Conversational Assistant</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-[11px]">
                Security Desk Assistance
              </h4>
              <p className="mb-2">Need immediate lost property assistance?</p>
              <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                <div>📞 Gate 1 Security: +91 120 232xxxx</div>
                <div>✉️ lostandfound@gniot.net.in</div>
                <div>📍 Plot No. 7, Knowledge Park II</div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 GNIOT Group of Institutions. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#privacy" onClick={e => e.preventDefault()} className="hover:underline">Privacy Policy</a>
              <a href="#terms" onClick={e => e.preventDefault()} className="hover:underline">Campus Terms</a>
              <a href="#security" onClick={e => e.preventDefault()} className="hover:underline">Security Architecture</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

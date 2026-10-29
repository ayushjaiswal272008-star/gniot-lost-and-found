import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink,
  Trash2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { ReportItem, AIMatchResult, Claim, NotificationItem } from '../types';

interface StudentDashboardProps {
  reports: ReportItem[];
  claims: Claim[];
  matches: AIMatchResult[];
  notifications: NotificationItem[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    rollNo: string;
    department: string;
    isEmailVerified: boolean;
  };
  onSelectItem: (report: ReportItem) => void;
  onMarkNotificationRead: (id: string) => void;
  onOpenReport: (type: 'lost' | 'found') => void;
  onDeleteReport?: (id: string) => Promise<void> | void;
  isAuthenticated?: boolean;
  onOpenAuth?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  reports,
  claims,
  matches,
  notifications,
  currentUser,
  onSelectItem,
  onMarkNotificationRead,
  onOpenReport,
  onDeleteReport,
  isAuthenticated = true,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'matches' | 'claims' | 'notifications'>('reports');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    if (onDeleteReport) {
      setDeletingId(id);
      try {
        await onDeleteReport(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const myLostReports = isAuthenticated && currentUser.id
    ? reports.filter(r => r.type === 'lost' && (r.userId === currentUser.id || (Boolean(currentUser.email) && r.userEmail === currentUser.email)))
    : [];
  const myFoundReports = isAuthenticated && currentUser.id
    ? reports.filter(r => r.type === 'found' && (r.userId === currentUser.id || (Boolean(currentUser.email) && r.userEmail === currentUser.email)))
    : [];
  const myClaims = isAuthenticated && currentUser.id
    ? claims.filter(c => c.claimantId === currentUser.id || (Boolean(currentUser.email) && c.claimantEmail === currentUser.email))
    : [];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-300 dark:border-[#D9A441]/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#30152F] via-[#481E46] to-[#D9A441] text-[#E8EDF2] font-extrabold text-xl flex items-center justify-center shadow-md">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#30152F] dark:text-[#E8EDF2] font-display">
                {currentUser.name || (isAuthenticated ? 'GNIOT Student' : 'Guest Student')}
              </h2>
              {currentUser.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D9A441]/15 text-[#BE8B2C] dark:text-[#D9A441] border border-[#D9A441]/30 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-[#D9A441]" />
                  Verified College Email
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-semibold">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70 mt-0.5">
              {currentUser.rollNo ? (
                <>Roll No: <span className="font-mono font-medium text-[#30152F] dark:text-[#E8EDF2]">{currentUser.rollNo}</span> • Dept: {currentUser.department} • GNIOT Greater Noida</>
              ) : (
                <>GNIOT Campus Recovery Network • Greater Noida</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReport('lost')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-bold text-xs transition-all shadow-md shadow-[#D9A441]/20"
          >
            + Report Lost
          </button>
          <button
            onClick={() => onOpenReport('found')}
            className="px-4 py-2.5 rounded-xl bg-[#30152F] hover:bg-[#240E23] text-[#E8EDF2] font-semibold text-xs border border-[#D9A441]/40 transition-all shadow-md"
          >
            + Report Found
          </button>
        </div>
      </div>

      {/* Unauthenticated Alert */}
      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#D9A441] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#30152F] dark:text-[#E8EDF2]">
                You are currently browsing as a Guest
              </p>
              <p className="text-[11px] text-slate-600 dark:text-[#E8EDF2]/70">
                Sign in or create an account with your GNIOT college email to track your reported items and claims permanently in Supabase.
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#C59132] text-[#190918] font-bold text-xs shadow-md shrink-0 hover:brightness-105 transition-all"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-300 dark:border-[#D9A441]/25 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Reports ({myLostReports.length + myFoundReports.length})
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'matches'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Matches ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          My Claims ({myClaims.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Tab 1: My Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#30152F] dark:text-[#E8EDF2] mb-3">
              Items I Reported Lost ({myLostReports.length})
            </h3>
            {myLostReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLostReports.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-4 rounded-2xl glass-card border border-slate-300 dark:border-[#D9A441]/20 hover:border-[#D9A441] cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center gap-4 group relative"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-500 font-semibold">{item.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D9A441]/20 text-[#BE8B2C] dark:text-[#D9A441]">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#30152F] dark:text-[#E8EDF2] truncate group-hover:text-[#D9A441] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70 truncate mt-0.5">{item.locationName} • {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onDeleteReport && (
                        <button
                          title="Delete report"
                          disabled={deletingId === item.id}
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#D9A441] transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-100 dark:bg-[#30152F]/40 border border-slate-200 dark:border-[#D9A441]/20">
                You have not reported any lost items.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-[#30152F] dark:text-[#E8EDF2] mb-3">
              Items I Found &amp; Turned In ({myFoundReports.length})
            </h3>
            {myFoundReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myFoundReports.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-4 rounded-2xl glass-card border border-slate-300 dark:border-[#D9A441]/20 hover:border-emerald-500 cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center gap-4 group relative"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-500 font-semibold">{item.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#30152F] dark:text-[#E8EDF2] truncate group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70 truncate mt-0.5">Custody: {item.storageDesk || 'Campus Desk'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onDeleteReport && (
                        <button
                          title="Delete report"
                          disabled={deletingId === item.id}
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-100 dark:bg-[#30152F]/40 border border-slate-200 dark:border-[#D9A441]/20">
                You have not reported any found items.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Matches */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                  Automated AI Neural Cross-Referencing
                </span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Calculated using Gemini visual analysis, category classification, color match, and Knowledge Park II campus proximity.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map(m => {
              const matchedFoundReport = reports.find(r => r.id === m.foundReportId);
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#D9A441]/20 text-[#190918] dark:text-[#D9A441] border border-[#D9A441]/30">
                        {m.matchScore}% {m.confidenceLevel}
                      </span>
                      <span className="text-xs text-slate-400">ID: {m.id}</span>
                    </div>
                    {matchedFoundReport && (
                      <button
                        onClick={() => onSelectItem(matchedFoundReport)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#C59132] text-[#190918] font-bold text-xs shadow-sm hover:brightness-105 transition-all flex items-center gap-1"
                      >
                        Inspect Match
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#1E0B1D] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Your Lost Report</span>
                      <span className="font-bold text-[#30152F] dark:text-slate-200">{m.lostItemTitle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Potential Candidate</span>
                      <span className="font-bold text-[#D9A441]">{m.foundItemTitle}</span>
                    </div>
                  </div>

                  {/* Multi-Factor Breakdown Chips */}
                  {m.factors && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] pt-1">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#280F27] border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">Visual:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{m.factors.visualScore}%</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#280F27] border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">Category:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{m.factors.categoryScore}%</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#280F27] border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">Location:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{m.factors.locationScore}%</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#280F27] border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">Date:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{m.factors.dateScore}%</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#280F27] border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-slate-500 block text-[9px]">Description:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{m.factors.semanticScore}%</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">AI Correlation Reasons:</span>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                      {m.matchReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: My Claims (8-State Tracking) */}
      {activeTab === 'claims' && (
        <div className="space-y-3">
          {myClaims.length > 0 ? (
            myClaims.map(c => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400 block">{c.id}</span>
                    <h4 className="font-bold text-sm sm:text-base text-[#30152F] dark:text-white">
                      Claim for: {c.itemTitle}
                    </h4>
                  </div>
                  <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold ${
                    c.status === 'handed_over' || c.status === 'closed' || c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    c.status === 'approved' || c.status === 'Approved' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' :
                    c.status === 'additional_evidence_requested' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    c.status === 'rejected' || c.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E0B1D] text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  <div><strong>Secret Clue Submitted:</strong> {c.distinctiveMarkAnswer}</div>
                  {c.adminNotes && (
                    <div className="text-[#D9A441] font-semibold">
                      <strong>Campus Custodian Note:</strong> {c.adminNotes}
                    </div>
                  )}
                  {c.handoverReceiptId && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      Digital Handover Receipt: {c.handoverReceiptId}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">Filed on: {new Date(c.createdAt).toLocaleDateString()}</div>
                </div>

                {c.status === 'approved' && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                    <span>✓ Claim Approved! Visit the campus security cell with your College ID to collect your item.</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 text-slate-500 text-xs">
              You haven&apos;t filed any claims yet. When you spot an item in the registry, click &quot;Claim / Verify Ownership&quot;.
            </div>
          )}
        </div>
      )}


      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => onMarkNotificationRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                n.isRead
                  ? 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  n.type === 'match' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                  n.type === 'claim' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {n.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

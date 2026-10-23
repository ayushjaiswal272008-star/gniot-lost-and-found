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
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'matches' | 'claims' | 'notifications'>('reports');

  const myLostReports = reports.filter(r => r.type === 'lost' && (r.userId === currentUser.id || r.userEmail === currentUser.email || r.userName.includes(currentUser.name)));
  const myFoundReports = reports.filter(r => r.type === 'found' && (r.userId === currentUser.id || r.userEmail === currentUser.email || r.userName.includes(currentUser.name)));
  const myClaims = claims.filter(c => c.claimantId === currentUser.id || c.claimantEmail === currentUser.email || c.claimantName.includes(currentUser.name));

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-300 dark:border-[#D9A441]/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#30152F] via-[#481E46] to-[#D9A441] text-[#E8EDF2] font-extrabold text-xl flex items-center justify-center shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#30152F] dark:text-[#E8EDF2] font-display">
                {currentUser.name}
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
              Roll No: <span className="font-mono font-medium text-[#30152F] dark:text-[#E8EDF2]">{currentUser.rollNo}</span> • Dept: {currentUser.department} • GNIOT Greater Noida
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Items I Reported Lost ({myLostReports.length})
            </h3>
            {myLostReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLostReports.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">{item.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{item.locationName} • {item.date}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                You have not reported any lost items.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Items I Found &amp; Turned In ({myFoundReports.length})
            </h3>
            {myFoundReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myFoundReports.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">{item.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">Custody: {item.storageDesk || 'Campus Desk'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
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
                  className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {m.matchScore}% {m.confidenceLevel}
                      </span>
                      <span className="text-xs text-slate-400">ID: {m.id}</span>
                    </div>
                    {matchedFoundReport && (
                      <button
                        onClick={() => onSelectItem(matchedFoundReport)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
                      >
                        Inspect Match
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Your Lost Report</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.lostItemTitle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Potential Candidate</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{m.foundItemTitle}</span>
                    </div>
                  </div>

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

      {/* Tab 3: My Claims */}
      {activeTab === 'claims' && (
        <div className="space-y-3">
          {myClaims.length > 0 ? (
            myClaims.map(c => (
              <div
                key={c.id}
                className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400 block">{c.id}</span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Claim for: {c.itemTitle}
                    </h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    c.status === 'Approved' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' :
                    c.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div><strong>Secret Clue Submitted:</strong> {c.distinctiveMarkAnswer}</div>
                  {c.adminNotes && (
                    <div className="text-indigo-600 dark:text-indigo-400">
                      <strong>Desk Notes:</strong> {c.adminNotes}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">Filed on: {new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-2xl glass-panel text-slate-500 text-xs">
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

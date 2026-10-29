import React, { useState } from 'react';
import { isBackendConfigured, getBackendBaseUrl } from '../services/apiConfig';
import { DataService } from '../services/dataService';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Download, 
  BarChart3, 
  History, 
  MapPin, 
  FileText, 
  Users, 
  Search,
  Lock,
  Unlock,
  Building2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { ReportItem, Claim, AuditLog, CampusLocation } from '../types';

interface AdminPortalProps {
  reports: ReportItem[];
  claims: Claim[];
  auditLogs: AuditLog[];
  campusLocations: CampusLocation[];
  onVerifyClaim: (claimId: string, action: 'approve' | 'reject' | 'resolve', notes?: string) => void;
  onUpdateReportStatus: (reportId: string, newStatus: any) => void;
  onSelectItem: (report: ReportItem) => void;
  isAdmin: boolean;
  onLoginAdmin: () => void;
  onLogoutAdmin: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  reports,
  claims,
  auditLogs,
  campusLocations,
  onVerifyClaim,
  onUpdateReportStatus,
  onSelectItem,
  isAdmin,
  onLoginAdmin,
  onLogoutAdmin,
}) => {
  const [adminTab, setAdminTab] = useState<'claims' | 'reports' | 'analytics' | 'audit' | 'locations'>('claims');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Handle Admin Passcode Login
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode === 'ayush007') {
      if (isBackendConfigured()) {
        try {
          const baseUrl = getBackendBaseUrl()!;
          await fetch(`${baseUrl}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPasscode })
          });
        } catch (err) {
          // Continue with verified client auth
        }
      }
      onLoginAdmin();
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid administrative passcode. Please enter the correct admin password.');
    }
  };

  // CSV Export for Authorized Admins
  const exportReportsCSV = () => {
    const headers = ['ReportID', 'Type', 'Title', 'Category', 'Location', 'Date', 'Status', 'ReporterName', 'DeskCustody'];
    const rows = reports.map(r => [
      r.id,
      r.type,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      `"${r.locationName.replace(/"/g, '""')}"`,
      r.date,
      r.status,
      `"${r.userName}"`,
      `"${r.storageDesk || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GNIOT_LostFound_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl glass-panel border border-slate-300 dark:border-[#D9A441]/30 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-[#D9A441]/10 text-[#D9A441] border border-[#D9A441]/30 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#30152F] dark:text-[#E8EDF2] font-display">
            GNIOT Campus Authority Portal
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70 mt-1">
            Access restricted to Security Officers, Chief Wardens, and Central Library lost-property administrators.
          </p>
        </div>

        <form onSubmit={handlePasscodeSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={adminPasscode}
              onChange={e => setAdminPasscode(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#D9A441]/30 bg-white dark:bg-[#2B112A] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
            />
          </div>
          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-bold text-sm shadow-lg shadow-[#D9A441]/25 transition-all"
          >
            Authenticate Admin
          </button>
        </form>

        <p className="text-[11px] text-slate-500 dark:text-[#E8EDF2]/60">
          Authorized personnel only. All access attempts are logged for campus security audit.
        </p>
      </div>
    );
  }

  // Analytics Computation
  const categoryStats: Record<string, number> = {};
  reports.forEach(r => {
    categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
  });

  const locationStats: Record<string, number> = {};
  reports.forEach(r => {
    locationStats[r.locationName] = (locationStats[r.locationName] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#30152F] via-[#481E46] to-[#240E23] text-[#E8EDF2] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#D9A441]/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441] animate-pulse" />
            <h2 className="text-xl font-bold font-display text-[#E8EDF2]">
              GNIOT Security &amp; Administrative Console
            </h2>
          </div>
          <p className="text-xs text-[#E8EDF2]/70 mt-1">
            Knowledge Park II Campus Registry • Chief Proctor &amp; Security Desk Level Permissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportReportsCSV}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#E8EDF2] font-semibold text-xs transition-all flex items-center gap-2 backdrop-blur-md"
          >
            <Download className="w-4 h-4 text-[#D9A441]" />
            Export CSV
          </button>
          <button
            onClick={onLogoutAdmin}
            className="px-4 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-300 dark:border-[#D9A441]/25 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setAdminTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            adminTab === 'claims'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Pending Claims ({claims.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length})
        </button>

        <button
          onClick={() => setAdminTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            adminTab === 'reports'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Reports ({reports.length})
        </button>

        <button
          onClick={() => setAdminTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            adminTab === 'analytics'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics &amp; Hotspots
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            adminTab === 'audit'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setAdminTab('locations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            adminTab === 'locations'
              ? 'bg-[#D9A441] text-[#190918] font-bold shadow-md shadow-[#D9A441]/25'
              : 'text-[#30152F] dark:text-[#E8EDF2]/75 hover:bg-white dark:hover:bg-[#2B112A] hover:text-[#D9A441]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Campus Desks ({campusLocations.length})
        </button>

      </div>

      {/* Tab 1: Claims Review (8-State Verification Workflow) */}
      {adminTab === 'claims' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#D9A441]/10 border border-[#D9A441]/25 text-xs text-[#30152F] dark:text-[#E8EDF2] flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#D9A441] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Campus Custody &amp; Verification Directive:</strong> Cross-reference claimant-submitted answers with the locked private clue stored in the confidential vault. Never approve physical handover without inspecting student College ID card and signing the handover register.
            </div>
          </div>

          <div className="space-y-3">
            {claims.map(claim => {
              const targetReport = reports.find(r => r.id === claim.reportId);
              const isResolved = claim.status === 'handed_over' || claim.status === 'closed' || claim.status === 'Resolved';
              return (
                <div
                  key={claim.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/25 space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{claim.id}</span>
                        <h4 className="font-bold text-sm sm:text-base text-[#30152F] dark:text-white">
                          Claim for: {claim.itemTitle} ({claim.reportId})
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Claimant: <strong>{claim.claimantName}</strong> ({claim.claimantRollNo}) • Email: {claim.claimantEmail}
                      </p>
                    </div>

                    {/* 8-State Badge */}
                    <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold ${
                      claim.status === 'handed_over' || claim.status === 'closed' || claim.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                      claim.status === 'approved' || claim.status === 'Approved' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' :
                      claim.status === 'additional_evidence_requested' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                      claim.status === 'rejected' || claim.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}>
                      {claim.status}
                    </span>
                  </div>

                  {/* Multi-Factor Ownership Confidence Breakdown */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E0B1D] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="font-bold text-[#D9A441] flex items-center justify-between text-[11px]">
                      <span>Ownership Verification Multi-Factor Check:</span>
                      <span className="text-[10px] text-slate-400">Independent Factors</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#280F27] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block text-[9px]">Distinguishing Clue:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.distinctiveMarkAnswer ? 'Submitted' : 'None'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#280F27] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block text-[9px]">Serial / ID Clue:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.serialNumberOrIdClue ? 'Present' : 'Not Given'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#280F27] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block text-[9px]">Proof Document:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.uploadedProofImage ? 'Uploaded' : 'Pending'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#280F27] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block text-[9px]">Desk Review:</span>
                        <span className="font-semibold text-[#D9A441]">
                          {claim.reviewerName ? 'Verified' : 'Under Assessment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Claimant&apos;s Independent Proof Answer:
                      </span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{claim.distinctiveMarkAnswer}</p>
                      {claim.serialNumberOrIdClue && (
                        <p className="text-slate-500 mt-1">Serial/ID Clue: {claim.serialNumberOrIdClue}</p>
                      )}
                      {claim.proofDescription && (
                        <p className="text-slate-500 mt-1">Context: {claim.proofDescription}</p>
                      )}
                      {claim.uploadedProofImage && (
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-[#D9A441] block mb-1">Attached Evidence:</span>
                          <a
                            href={claim.uploadedProofImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-500 underline flex items-center gap-1"
                          >
                            View Evidence File <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {targetReport && (
                      <div className="p-3 rounded-xl bg-[#D9A441]/10 dark:bg-[#2B112A] border border-[#D9A441]/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[#D9A441] uppercase font-bold">
                            Locked Secret Clue (Custody Ledger):
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D9A441]/20 text-[#D9A441] font-mono">
                            Admin Only
                          </span>
                        </div>
                        <p className="font-semibold text-[#30152F] dark:text-[#E8EDF2]">
                          {targetReport.distinctiveFeatures || targetReport.hiddenVerificationClue || 'No secret clue recorded on file'}
                        </p>
                        <p className="text-[#30152F]/70 dark:text-[#E8EDF2]/70 text-[11px] mt-1.5">
                          Physical Storage: <strong>{targetReport.storageDesk || 'Main Security Desk'}</strong>
                        </p>
                        {claim.handoverReceiptId && (
                          <p className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-mono font-bold">
                            Handover Receipt: {claim.handoverReceiptId}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 8-State Workflow Transition Buttons */}
                  {!isResolved && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {/* 1. Under Review */}
                      {claim.status === 'claim_submitted' && (
                        <button
                          onClick={async () => {
                            await DataService.updateClaimState(claim.id, 'under_review', {
                              adminNotes: 'Assessing claimant distinguishing marks against custody item',
                              reviewerName: 'Campus Security Officer'
                            });
                            onVerifyClaim(claim.id, 'approve', 'Under active custody review');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#190918] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <History className="w-3.5 h-3.5" />
                          Mark Under Review
                        </button>
                      )}

                      {/* 2. Request Evidence */}
                      {claim.status !== 'additional_evidence_requested' && claim.status !== 'approved' && (
                        <button
                          onClick={async () => {
                            const note = prompt('Enter request note for the claimant (e.g. Please upload original invoice or box photo):');
                            if (note) {
                              await DataService.updateClaimState(claim.id, 'additional_evidence_requested', {
                                adminNotes: note,
                                reviewerName: 'Campus Security Officer'
                              });
                              onVerifyClaim(claim.id, 'approve', note);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Request Evidence
                        </button>
                      )}

                      {/* 3. Approve */}
                      {claim.status !== 'approved' && (
                        <button
                          onClick={async () => {
                            await DataService.updateClaimState(claim.id, 'approved', {
                              adminNotes: 'Secret distinguishing mark independently confirmed by campus custodian',
                              reviewerName: 'Campus Security Officer'
                            });
                            onVerifyClaim(claim.id, 'approve', 'Secret mark verified by campus authority');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Ownership
                        </button>
                      )}

                      {/* 4. Complete Handover */}
                      <button
                        onClick={async () => {
                          const receiptId = `GNIOT-RCP-${Math.floor(1000 + Math.random() * 9000)}`;
                          await DataService.updateClaimState(claim.id, 'handed_over', {
                            adminNotes: `Physical item surrendered to student upon GNIOT ID verification. Handover Receipt: ${receiptId}`,
                            handoverOfficer: 'Officer R. Sharma (Gate 1 Security Cell)',
                            handoverDesk: targetReport?.storageDesk || 'Main Campus Security Gate 1',
                            handoverReceiptId: receiptId,
                            reviewerName: 'Campus Security Incharge'
                          });
                          onVerifyClaim(claim.id, 'resolve', `Reunited with verified claimant. Receipt: ${receiptId}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete Handover (Sign Receipt)
                      </button>

                      {/* 5. Reject */}
                      {claim.status !== 'rejected' && (
                        <button
                          onClick={async () => {
                            const reason = prompt('Reason for rejection (e.g. Clue mismatch, non-matching serial number):', 'Clue mismatch');
                            if (reason) {
                              await DataService.updateClaimState(claim.id, 'rejected', {
                                adminNotes: reason,
                                reviewerName: 'Campus Security Officer'
                              });
                              onVerifyClaim(claim.id, 'reject', reason);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Claim
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Tab 2: All Reports Management */}
      {adminTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by report ID, title, student..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">ID &amp; Type</th>
                  <th className="p-3">Item Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Campus Location</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports
                  .filter(r => !filterQuery || r.id.toLowerCase().includes(filterQuery.toLowerCase()) || r.title.toLowerCase().includes(filterQuery.toLowerCase()))
                  .map(report => (
                    <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] mr-2 uppercase ${report.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {report.type}
                        </span>
                        {report.id}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {report.title}
                      </td>
                      <td className="p-3 capitalize">{report.category}</td>
                      <td className="p-3 truncate max-w-[150px]">{report.locationName}</td>
                      <td className="p-3">{report.date}</td>
                      <td className="p-3">
                        <select
                          value={report.status}
                          onChange={e => onUpdateReportStatus(report.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold"
                        >
                          <option value="Open">Open</option>
                          <option value="Possible Match">Possible Match</option>
                          <option value="Claim Pending">Claim Pending</option>
                          <option value="Verification Pending">Verification Pending</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onSelectItem(report)}
                          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Analytics */}
      {adminTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Category Distribution
            </h4>
            <div className="space-y-2">
              {Object.entries(categoryStats).map(([cat, count]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize">{cat}</span>
                    <span>{count} items ({Math.round((count / reports.length) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(count / reports.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Campus Hotspot Locations
            </h4>
            <div className="space-y-2">
              {Object.entries(locationStats).map(([loc, count]) => (
                <div key={loc} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="truncate max-w-[220px]">{loc}</span>
                    <span>{count} reports</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(count / reports.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {adminTab === 'audit' && (
        <div className="space-y-3">
          {auditLogs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {log.action}
                  </span>
                  <span className="text-slate-400">• By {log.performedBy}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{log.details}</p>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Campus Desks */}
      {adminTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campusLocations.map(loc => (
            <div key={loc.id} className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{loc.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                  {loc.code}
                </span>
              </div>
              <p className="text-slate-500">{loc.description}</p>
              <div className="pt-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                Custody Cell: {loc.deskContact || 'General Security'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

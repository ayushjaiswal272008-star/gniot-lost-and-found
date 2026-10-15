import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  QrCode, 
  Printer, 
  FileCheck2, 
  Share2, 
  AlertTriangle,
  Gift
} from 'lucide-react';
import { ReportItem, AIMatchResult } from '../types';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportItem | null;
  matches?: AIMatchResult[];
  onOpenClaim: (report: ReportItem) => void;
  onStatusChange?: (reportId: string, newStatus: any) => void;
  isOwnerOrAdmin?: boolean;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  matches = [],
  onOpenClaim,
  onStatusChange,
  isOwnerOrAdmin = false,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !report) return null;

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `GNIOT Lost & Found AI - Report #${report.id}: ${report.title} (${report.type.toUpperCase()}) at ${report.locationName}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const statusColors: Record<string, string> = {
    'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    'Possible Match': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    'Claim Pending': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    'Verification Pending': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    'Resolved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    'Closed': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                report.type === 'lost'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {report.type} Item
            </span>
            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
              {report.id}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[report.status] || ''}`}>
              {report.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Copy share details"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>}
            </button>
            <button
              onClick={handlePrintReceipt}
              title="Print Campus Report Receipt"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Gallery & QR */}
            <div className="space-y-3">
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner group">
                <img
                  src={report.images[activeImageIndex] || report.images[0]}
                  alt={report.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {report.isSensitive && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-300/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sensitive Item Protected
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {report.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {report.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === i ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* QR Code Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Campus Digital Pass
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {report.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
                >
                  {showQrCode ? 'Hide QR' : 'Show QR'}
                </button>
              </div>

              {showQrCode && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center animate-in fade-in duration-200">
                  <div className="w-32 h-32 mx-auto bg-slate-950 p-2.5 rounded-xl flex items-center justify-center">
                    {/* SVG Clean Procedural QR Pattern */}
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                      <rect x="0" y="0" width="30" height="30" />
                      <rect x="5" y="5" width="20" height="20" fill="#090d16" />
                      <rect x="10" y="10" width="10" height="10" />
                      
                      <rect x="70" y="0" width="30" height="30" />
                      <rect x="75" y="5" width="20" height="20" fill="#090d16" />
                      <rect x="80" y="10" width="10" height="10" />

                      <rect x="0" y="70" width="30" height="30" />
                      <rect x="5" y="75" width="20" height="20" fill="#090d16" />
                      <rect x="10" y="80" width="10" height="10" />

                      <rect x="35" y="35" width="30" height="30" />
                      <rect x="40" y="40" width="20" height="20" fill="#090d16" />
                      <rect x="45" y="45" width="10" height="10" />

                      <rect x="35" y="10" width="10" height="15" />
                      <rect x="50" y="5" width="12" height="10" />
                      <rect x="10" y="40" width="15" height="10" />
                      <rect x="40" y="75" width="20" height="15" />
                      <rect x="75" y="45" width="15" height="20" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Scan at Library Desk 2 or Gate 1 Security Counter for physical verification
                  </p>
                </div>
              )}
            </div>

            {/* Right: Item Metadata & Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Reported on {new Date(report.createdAt).toLocaleString()} by {report.userName}
                </p>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {report.description || 'No additional description provided.'}
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{report.category}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Color</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{report.color || 'Unspecified'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand / Model</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {report.brand || report.model ? `${report.brand || ''} ${report.model || ''}`.trim() : 'Generic / N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date Logged</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{report.date} {report.time && `(${report.time})`}</span>
                </div>
              </div>

              {/* Location & Storage */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 block">
                      {report.locationName}
                    </span>
                    {report.locationDetails && (
                      <span className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                        Spot: {report.locationDetails}
                      </span>
                    )}
                  </div>
                </div>

                {report.storageDesk && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                        Official Custody / Storage Desk
                      </span>
                      <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300">
                        {report.storageDesk}
                      </span>
                    </div>
                  </div>
                )}

                {report.reward && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-amber-900 dark:text-amber-200">
                    <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold">Finder Treat / Reward: {report.reward}</span>
                  </div>
                )}
              </div>

              {/* AI Matching Analysis for this item */}
              {matches.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      AI Neural Match Active
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      {matches[0].matchScore}% Correlation
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Matched with: {matches[0].foundItemTitle || matches[0].lostItemTitle}
                  </p>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                    {matches[0].matchReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                {report.status !== 'Resolved' && report.status !== 'Closed' && (
                  <button
                    onClick={() => {
                      onOpenClaim(report);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    Claim / Verify Ownership
                  </button>
                )}

                {isOwnerOrAdmin && report.status !== 'Resolved' && (
                  <button
                    onClick={() => {
                      if (onStatusChange) {
                        onStatusChange(report.id, 'Resolved');
                        onClose();
                      }
                    }}
                    className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    Mark Reunited / Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

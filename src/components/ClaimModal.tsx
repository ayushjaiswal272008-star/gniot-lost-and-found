import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  HelpCircle,
  FileCheck2,
  Upload,
  Lock,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReportItem, Claim, ClaimState } from '../types';
import { DataService } from '../services/dataService';
import { uploadClaimEvidence } from '../services/supabaseClient';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportItem | null;
  currentUser: { id?: string; name: string; email: string; rollNo?: string };
  onClaimSubmitted: (claim: Claim) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  report,
  currentUser,
  onClaimSubmitted,
}) => {
  const [proofDescription, setProofDescription] = useState('');
  const [distinctiveMarkAnswer, setDistinctiveMarkAnswer] = useState('');
  const [serialNumberOrIdClue, setSerialNumberOrIdClue] = useState('');
  const [claimantPhone, setClaimantPhone] = useState('+91 9876543210');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<Claim | null>(null);

  if (!isOpen || !report) return null;

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Evidence document must be smaller than 10MB');
      return;
    }

    setEvidenceFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setEvidencePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distinctiveMarkAnswer.trim() && !proofDescription.trim()) {
      alert('Please describe private distinguishing details so campus custodians can verify ownership.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Submit claim to registry
      const newClaim = await DataService.createClaim({
        reportId: report.id,
        itemTitle: report.title,
        itemType: report.type,
        claimantId: currentUser.id || currentUser.rollNo || 'claimant-user',
        claimantName: currentUser.name || 'Campus Student',
        claimantEmail: currentUser.email || '',
        claimantRollNo: currentUser.rollNo || '',
        claimantPhone,
        proofDescription,
        distinctiveMarkAnswer,
        serialNumberOrIdClue,
      });

      // 2. Upload optional proof evidence document if attached
      if (evidenceFile) {
        try {
          const uploadRes = await uploadClaimEvidence(evidenceFile, newClaim.id, currentUser.rollNo);
          if (uploadRes.url) {
            await DataService.addClaimEvidence(newClaim.id, {
              fileUrl: uploadRes.url,
              fileName: uploadRes.fileName,
              fileType: uploadRes.fileType,
              uploadedBy: currentUser.name || 'Claimant',
              description: 'Claimant ownership proof attachment'
            });
          }
        } catch (uploadErr) {
          console.warn('Evidence upload failed, but claim was created:', uploadErr);
        }
      }

      setSubmittedClaim(newClaim);
      onClaimSubmitted(newClaim);
      setIsSuccess(true);

      // Confetti celebration
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      alert(err.message || 'Error submitting claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setProofDescription('');
    setDistinctiveMarkAnswer('');
    setSerialNumberOrIdClue('');
    setEvidenceFile(null);
    setEvidencePreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#190918]/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#E8EDF2] dark:bg-[#1E0B1D] rounded-3xl border border-slate-300 dark:border-[#D9A441]/35 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-white/90 dark:bg-[#280F27] border-b border-slate-300 dark:border-[#D9A441]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#D9A441]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#30152F] dark:text-[#E8EDF2] font-display flex items-center gap-2">
                Secure Ownership Claim
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30">
                  Protected
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70">
                Item: {report.title} ({report.id})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-[#30152F] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Privacy Boundary Banner */}
              <div className="p-3.5 rounded-2xl bg-[#30152F]/10 dark:bg-[#2B112A] border border-[#D9A441]/30 flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#D9A441] shrink-0 mt-0.5" />
                <div className="text-xs text-[#30152F] dark:text-[#E8EDF2]/90 leading-relaxed">
                  <span className="font-bold text-[#D9A441] block mb-0.5">
                    Private Clue Verification Protocol
                  </span>
                  To protect genuine owners, secret marks are never shown publicly or revealed in multiple-choice quizzes. Please independently describe details only the rightful owner would know.
                </div>
              </div>

              {/* Custody Desk */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#250D24] border border-slate-300 dark:border-[#D9A441]/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#D9A441]" />
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                      Physical Custody Location
                    </span>
                    <span className="font-semibold text-[#30152F] dark:text-[#E8EDF2]">
                      {report.storageDesk || 'Main Campus Security Gate 1'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D9A441]/15 text-[#D9A441] border border-[#D9A441]/25">
                  Handover Desk
                </span>
              </div>

              {/* Distinguishing Marks Answer */}
              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Private Distinguishing Mark or Secret Clue *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g., Specific sticker, custom wallpaper on lockscreen, scratch on bottom-left, specific coin/card inside..."
                  value={distinctiveMarkAnswer}
                  onChange={e => setDistinctiveMarkAnswer(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#250D24] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  The campus custodian will cross-reference this against the physical item prior to handover.
                </p>
              </div>

              {/* Serial number / ID clue */}
              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Serial Number, MAC ID, or Roll Number on Item (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Last 4 digits of serial, Bluetooth SSID, student roll number written on cover"
                  value={serialNumberOrIdClue}
                  onChange={e => setSerialNumberOrIdClue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#250D24] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                />
              </div>

              {/* Misplacement Context */}
              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Circumstance of Loss / Location Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief context confirming your presence around that campus block or lab..."
                  value={proofDescription}
                  onChange={e => setProofDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#250D24] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                />
              </div>

              {/* Proof / Document Upload (Encrypted Evidence) */}
              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1 flex items-center justify-between">
                  <span>Supporting Evidence Document (Optional)</span>
                  <span className="text-[10px] text-[#D9A441] font-mono">Receipt / Box / Photo</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#D9A441]/50 bg-white/70 dark:bg-[#250D24] hover:bg-[#D9A441]/10 cursor-pointer text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] transition-all">
                    <Upload className="w-4 h-4 text-[#D9A441]" />
                    <span>{evidenceFile ? evidenceFile.name : 'Upload Purchase Invoice / Box / Photo Proof'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleEvidenceChange}
                      className="hidden"
                    />
                  </label>
                  {evidenceFile && (
                    <button
                      type="button"
                      onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}
                      className="p-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {evidencePreview && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-[#D9A441]/40">
                    <img src={evidencePreview} alt="Evidence preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Stored securely in private custody storage; strictly viewable only by authorized verification staff.
                </p>
              </div>

              {/* Claimant Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Registered College Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.email || 'student@gniot.net.in'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#250D24]/60 text-slate-600 dark:text-slate-400 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone (For Handover Call)
                  </label>
                  <input
                    type="text"
                    value={claimantPhone}
                    onChange={e => setClaimantPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#250D24] text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 disabled:opacity-50 text-[#190918] font-bold text-sm shadow-lg shadow-[#D9A441]/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registering Ownership Claim...</span>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 text-[#190918]" />
                      Submit Verification Claim
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#30152F] dark:text-[#E8EDF2] font-display">
                  Claim Request Filed!
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#E8EDF2]/70 mt-1">
                  Claim ID: <span className="font-mono font-bold text-[#D9A441]">{submittedClaim?.id}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D9A441]/15 text-[#D9A441] border border-[#D9A441]/30">
                  <Clock className="w-3.5 h-3.5" />
                  Workflow Status: claim_submitted
                </div>
              </div>

              {/* 8-State Workflow Indicator */}
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#2B112A] border border-slate-300 dark:border-[#D9A441]/25 text-left space-y-3 text-xs text-[#30152F] dark:text-[#E8EDF2]">
                <div className="font-bold text-[#D9A441] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Verification &amp; Collection Steps:
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <div>
                      <strong>Claim Registered (claim_submitted):</strong> Your clue has been securely transferred to the campus custodian.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#D9A441]/20 text-[#D9A441] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <div>
                      <strong>Custodian Review (under_review):</strong> Security authority at <span className="font-semibold">{report.storageDesk || 'Main Campus Security Gate 1'}</span> cross-references your distinguishing mark against the locked property.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <div>
                      <strong>Physical Handover (handed_over):</strong> Present your GNIOT Student ID card at the desk, inspect your item, and sign the digital receipt.
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-[#30152F] hover:bg-[#200D1F] text-[#E8EDF2] font-semibold text-sm border border-[#D9A441]/30 transition-all shadow-md"
              >
                Close &amp; Track in Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

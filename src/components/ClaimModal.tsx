import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReportItem, Claim } from '../types';
import { DataService } from '../services/dataService';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportItem | null;
  currentUser: { name: string; email: string; rollNo?: string };
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<Claim | null>(null);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distinctiveMarkAnswer.trim() && !proofDescription.trim()) {
      alert('Please answer the proof questions so the campus authority can verify your claim.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newClaim = await DataService.createClaim({
        reportId: report.id,
        claimantId: 'user-ayush',
        claimantName: currentUser.name || 'Ayush Jaiswal',
        claimantEmail: currentUser.email || 'ayushjaiswal272008@gmail.com',
        claimantRollNo: currentUser.rollNo || '240133010001',
        claimantPhone,
        proofDescription,
        distinctiveMarkAnswer,
        serialNumberOrIdClue,
      });

      setSubmittedClaim(newClaim);
      onClaimSubmitted(newClaim);
      setIsSuccess(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Secure Ownership Claim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Item: {report.title} ({report.id})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Campus Custody Desk: {report.storageDesk || 'Main Campus Security Gate 1'}
                  </span>
                  To prevent fraudulent claims, describe details known only to the genuine owner.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Private Distinguishing Mark or Secret Clue *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Sticker on back lid, scratch on bottom corner, lockscreen picture, specific item stored inside..."
                  value={distinctiveMarkAnswer}
                  onChange={e => setDistinctiveMarkAnswer(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  The campus custodian will cross-reference this against the physical item.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Serial Number, Password Hint, or ID Clue (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Last digits of serial, Bluetooth broadcast name, library card number"
                  value={serialNumberOrIdClue}
                  onChange={e => setSerialNumberOrIdClue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  How/Where Did You Misplace It?
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief context confirming your presence at that campus location around that time..."
                  value={proofDescription}
                  onChange={e => setProofDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Registered College Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.email || 'student@gniot.net.in'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone (For Verification Call)
                  </label>
                  <input
                    type="text"
                    value={claimantPhone}
                    onChange={e => setClaimantPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registering Ownership Claim...</span>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      Submit Verification Claim
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  Claim Request Filed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Claim ID: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{submittedClaim?.id}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-left space-y-2 text-xs text-indigo-950 dark:text-indigo-200">
                <div className="font-bold">Next Steps for Collection:</div>
                <div>1. The lost-property incharge at <span className="font-semibold">{report.storageDesk || 'Main Campus Security Gate 1'}</span> has received your claim.</div>
                <div>2. Visit the desk with your physical <span className="font-semibold">GNIOT Student ID Card</span>.</div>
                <div>3. Upon visual verification of your clue, sign the digital handover register to collect your item.</div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all"
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

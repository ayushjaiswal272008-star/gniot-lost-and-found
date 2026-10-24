import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Gift, 
  Tag, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  Trash2
} from 'lucide-react';
import { ItemCategory, CampusLocation, ReportItem, AIMatchResult } from '../types';
import { DataService } from '../services/dataService';
import { uploadItemImage } from '../lib/supabase';

interface ReportLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  campusLocations: CampusLocation[];
  onReportCreated: (report: ReportItem, matches: AIMatchResult[]) => void;
  currentUser: { name: string; email: string; rollNo?: string };
}

export const ReportLostModal: React.FC<ReportLostModalProps> = ({
  isOpen,
  onClose,
  campusLocations,
  onReportCreated,
  currentUser,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdReport, setCreatedReport] = useState<ReportItem | null>(null);
  const [autoMatches, setAutoMatches] = useState<AIMatchResult[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('earphones');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [locationId, setLocationId] = useState(campusLocations[0]?.id || 'loc-1');
  const [locationDetails, setLocationDetails] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [distinctiveFeatures, setDistinctiveFeatures] = useState('');
  const [contactPreference, setContactPreference] = useState<'Campus Desk' | 'In-App Message' | 'College Email'>('Campus Desk');
  const [reward, setReward] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  if (!isOpen) return null;

  const categories: ItemCategory[] = [
    'ID card',
    'wallet',
    'mobile phone',
    'laptop',
    'earphones',
    'books',
    'bag',
    'keys',
    'clothing',
    'accessories',
    'documents',
    'electronics',
    'water bottle',
    'other'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        continue;
      }
      const res = await uploadItemImage(file, currentUser.name);
      if (res.url) {
        setImages(prev => [...prev, res.url]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category || !locationId) {
      alert('Please fill in the title, category, and campus location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedLoc = campusLocations.find(l => l.id === locationId);
      const payload = {
        type: 'lost',
        title,
        category,
        description,
        date,
        time,
        locationId,
        locationName: selectedLoc ? selectedLoc.name : 'GNIOT Campus',
        locationDetails,
        color,
        brand,
        model,
        distinctiveFeatures,
        contactPreference,
        reward,
        isSensitive: isSensitive || ['ID card', 'wallet', 'documents', 'keys'].includes(category),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'],
        userName: currentUser.name || 'GNIOT Student',
        userEmail: currentUser.email || 'student@gniot.net.in',
        userRollNo: currentUser.rollNo || '230133010xxxx',
      };

      const data = await DataService.createReport(payload);

      setCreatedReport(data.report);
      setAutoMatches(data.autoMatches || []);
      onReportCreated(data.report, data.autoMatches || []);
      setStep(4); // Success step
    } catch (err: any) {
      alert(err.message || 'Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setImages([]);
    setCreatedReport(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#30152F]/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#30152F] rounded-3xl border border-[#30152F]/15 dark:border-[#D9A441]/25 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-[#30152F] border-b border-[#30152F]/10 dark:border-[#D9A441]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9A441] text-[#30152F] flex items-center justify-center font-black">
              !
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E8EDF2] font-display">
                Report a Lost Item
              </h2>
              <p className="text-xs text-[#E8EDF2]/70">
                GNIOT Campus AI Lost &amp; Found Portal
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-[#E8EDF2]/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        {step < 4 && (
          <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-[#30152F]/10 dark:border-[#D9A441]/20 bg-[#E8EDF2] dark:bg-[#240E23]">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 1 ? 'bg-[#D9A441] text-[#30152F]' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                1
              </span>
              <span className="text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2]">Basic Info</span>
            </div>
            <div className="h-0.5 w-10 bg-[#30152F]/15 dark:bg-[#D9A441]/30" />
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 2 ? 'bg-[#D9A441] text-[#30152F]' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                2
              </span>
              <span className="text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2]">Campus Location</span>
            </div>
            <div className="h-0.5 w-10 bg-[#30152F]/15 dark:bg-[#D9A441]/30" />
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 3 ? 'bg-[#D9A441] text-[#30152F]' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                3
              </span>
              <span className="text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2]">Distinctive Clues</span>
            </div>
          </div>
        )}

        {/* Step Contents */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Boat Airdopes 141 or Apple iPhone 14 with blue case"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Color *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Navy Blue, Matte Black, Silver"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide any context about where you were, when you noticed it was gone, or key identifiers..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Photo Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photographs of Item (Reference or Actual)
                </label>
                <div className="flex flex-wrap gap-3 mb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group">
                      <img src={img} alt="upload" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-red-500 transition-all">
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  You can upload photos from your camera or gallery to boost AI Vision similarity matching.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Location / Building *
                </label>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {campusLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      [{loc.zone}] {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exact Room, Seat or Spot Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab 204 Workstation 18, 2nd floor library reading table, Canteen Nescafe bench"
                  value={locationDetails}
                  onChange={e => setLocationDetails(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date When Lost *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approximate Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="font-semibold">Knowledge Park II Campus Zones:</span> Selected campus zone will cross-reference nearby lost property desks (Library Counter 2, Security Gate 1) automatically.
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Boat, Apple, Samsung, Titan, Milton"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model Number or Series
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Airdopes 141, Galaxy M32, Titan 901"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identifying Marks / Secret Clues (Private Ownership Proof)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Astronaut sticker on rear lid, small dent on bottom rim, lock screen wallpaper of mountain peak..."
                  value={distinctiveFeatures}
                  onChange={e => setDistinctiveFeatures(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  This clue is used to verify you as genuine owner if someone finds and hands over the item.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Preference
                  </label>
                  <select
                    value={contactPreference}
                    onChange={e => setContactPreference(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Campus Desk">Authorized Campus Desk (Safe &amp; Recommended)</option>
                    <option value="In-App Message">In-App Notification</option>
                    <option value="College Email">College GNIOT Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Optional Treat / Reward (Policy Permitted)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹200 treat at GNIOT Nescafe / Gratitude"
                    value={reward}
                    onChange={e => setReward(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Sensitive Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Sensitive Item Masking
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mask personal identifiers (ID roll numbers, photos, private contacts) from public view.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSensitive}
                  onChange={e => setIsSensitive(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
              </div>
            </div>
          )}

          {step === 4 && createdReport && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  Lost Item Successfully Registered!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Report ID: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{createdReport.id}</span>
                </p>
              </div>

              {/* Instant AI Matches Display */}
              <div className="text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    AI Neural Engine Results
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {autoMatches.length} Candidate(s) Scanned
                  </span>
                </div>

                {autoMatches.length > 0 ? (
                  <div className="space-y-2">
                    {autoMatches.map(m => (
                      <div key={m.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            {m.foundItemTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Confidence: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{m.confidenceLevel} ({m.matchScore}%)</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                          {m.matchScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No immediate match in current found registry. Our AI engine is continuously monitoring new found item submissions and will notify you instantly!
                  </p>
                )}
              </div>

              <button
                onClick={resetAndClose}
                className="w-full py-3 rounded-xl bg-[#D9A441] hover:bg-[#c99532] text-[#30152F] font-bold text-sm shadow-md transition-all"
              >
                Done &amp; View in Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 4 && (
          <div className="px-6 py-4 bg-[#E8EDF2]/90 dark:bg-[#240E23] border-t border-[#30152F]/10 dark:border-[#D9A441]/20 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-[#30152F]/20 dark:border-[#D9A441]/30 text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] hover:bg-white dark:hover:bg-[#30152F] transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#D9A441] hover:bg-[#c99532] text-[#30152F] text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-[#D9A441] hover:bg-[#c99532] text-[#30152F] text-xs font-bold shadow-lg shadow-[#D9A441]/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting &amp; AI Scanning...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#30152F]" />
                    Submit Lost Report
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

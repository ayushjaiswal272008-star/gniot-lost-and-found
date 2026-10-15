import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  Trash2,
  Building2
} from 'lucide-react';
import { ItemCategory, CampusLocation, ReportItem, AIMatchResult } from '../types';

interface ReportFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  campusLocations: CampusLocation[];
  onReportCreated: (report: ReportItem, matches: AIMatchResult[]) => void;
  currentUser: { name: string; email: string };
}

export const ReportFoundModal: React.FC<ReportFoundModalProps> = ({
  isOpen,
  onClose,
  campusLocations,
  onReportCreated,
  currentUser,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdReport, setCreatedReport] = useState<ReportItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('wallet');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [locationId, setLocationId] = useState(campusLocations[1]?.id || 'loc-2');
  const [locationDetails, setLocationDetails] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [storageDesk, setStorageDesk] = useState('GNIOT Central Library Circulation Counter 2');
  const [hiddenVerificationClue, setHiddenVerificationClue] = useState('');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category || !locationId) {
      alert('Please fill in title, category, and location found.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedLoc = campusLocations.find(l => l.id === locationId);
      const payload = {
        type: 'found',
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
        storageDesk: storageDesk || (selectedLoc?.deskContact || 'Main Campus Security Gate 1'),
        hiddenVerificationClue,
        isSensitive: isSensitive || ['ID card', 'wallet', 'documents', 'keys'].includes(category),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
        userName: currentUser.name || 'Helpful Student',
        userEmail: currentUser.email || 'finder@gniot.net.in',
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to register found report');
      const data = await res.json();

      setCreatedReport(data.report);
      onReportCreated(data.report, data.autoMatches || []);
    } catch (err: any) {
      alert(err.message || 'Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setDescription('');
    setImages([]);
    setCreatedReport(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Report a Found Item
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help return an item to a fellow GNIOT student
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {!createdReport ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Black Titan Wallet, Blue Earbuds Case, College Pass"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    Item Color *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Black, Silver, Navy Blue, Red"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Where Did You Find It? *
                  </label>
                  <select
                    value={locationId}
                    onChange={e => setLocationId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {campusLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Spot Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Under bench near Nescafe, Table 4"
                    value={locationDetails}
                    onChange={e => setLocationDetails(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Found *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approximate Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Authorized Desk Custody */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Storage Location / Authorized Campus Desk *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GNIOT Library Circulation Counter 2, Security Gate 1 Incharge, Lab 204 Assistant"
                  value={storageDesk}
                  onChange={e => setStorageDesk(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  We recommend handing valuable items to official campus lost-property cells (Security Gate 1 or Central Library Counter 2).
                </p>
              </div>

              {/* Secret Verification Clue */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Secret Verification Clue (Kept 100% Hidden from Public)
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Specific sticker on back, serial ends with 41, ₹150 cash inside, engraving name..."
                  value={hiddenVerificationClue}
                  onChange={e => setHiddenVerificationClue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-1.5">
                  This detail will NOT be shown publicly on the website. Genuine owners must state this exact clue to verify ownership.
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Photo of Found Item
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

                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-500 transition-all">
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
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registering with Campus Registry...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Submit Found Report
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  Found Item Registered!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Report ID: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{createdReport.id}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  Thank you for contributing to campus integrity! The AI matching engine has matched this against existing lost reports and notified students who lost similar items.
                </p>
              </div>

              <button
                onClick={resetAndClose}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all"
              >
                Close &amp; Return to Campus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

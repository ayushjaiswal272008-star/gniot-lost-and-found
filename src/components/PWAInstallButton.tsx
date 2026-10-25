import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // If already installed as a standalone app, hide install controls
  if (isInstalled) {
    return null;
  }

  // Handle click on Install button
  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // In case browser ambient badge or Android Chrome menu is needed
      alert('To install on Android: Tap the three dots (⋮) in your Chrome browser menu and tap "Install app" or "Add to Home screen".');
    }
  };

  // Header Variant (compact button in navbar)
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title="Install GNIOT Lost & Found App on your device"
          className={`px-3 py-2 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-bold text-xs shadow-md shadow-[#D9A441]/20 flex items-center gap-1.5 transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {/* iOS Guided Install Modal */}
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#30152F] text-[#E8EDF2] border border-[#D9A441]/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#D9A441] text-[#30152F] flex items-center justify-center font-black text-sm">
                    G
                  </div>
                  <h3 className="font-bold text-sm text-[#E8EDF2]">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <Share className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Step 1:</span> Tap the <strong>Share</strong> button at the bottom of Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <PlusSquare className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Step 2:</span> Scroll down and tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#D9A441] text-[#190918] font-bold text-xs hover:brightness-105 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Floating Banner Variant (visible on mobile screens until dismissed)
  if (variant === 'banner' && !isBannerDismissed) {
    return (
      <>
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 p-4 rounded-3xl glass-panel shadow-2xl border border-[#D9A441]/40 bg-[#30152F]/95 text-[#E8EDF2] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D9A441] to-[#30152F] p-0.5 shrink-0 shadow-md">
              <div className="w-full h-full bg-[#30152F] rounded-[14px] flex items-center justify-center text-[#D9A441] font-black text-sm">
                G
              </div>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-[#E8EDF2] truncate">Install GNIOT Lost &amp; Found</h4>
              <p className="text-[11px] text-slate-300 truncate">Fast campus recovery directly from your home screen.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-black text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS Modal */}
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#30152F] text-[#E8EDF2] border border-[#D9A441]/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#D9A441] text-[#30152F] flex items-center justify-center font-black text-sm">
                    G
                  </div>
                  <h3 className="font-bold text-sm text-[#E8EDF2]">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <Share className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Step 1:</span> Tap the <strong>Share</strong> icon at the bottom of Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <PlusSquare className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Step 2:</span> Tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#D9A441] text-[#190918] font-bold text-xs hover:brightness-105 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

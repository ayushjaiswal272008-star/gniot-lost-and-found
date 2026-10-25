import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-18 inset-x-0 z-50 flex items-center justify-center p-2.5 bg-amber-600 text-white shadow-lg animate-in slide-in-from-top-2 text-xs font-semibold">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            <strong>Offline Mode Active:</strong> You are viewing cached app pages. New reports and claim submissions require an internet connection to sync with Supabase.
          </span>
        </div>
      </div>
    </div>
  );
};

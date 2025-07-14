import React from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary text-white p-3 sm:p-4 shadow-material safe-area-pt">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 bg-white rounded-lg p-1">
            <img 
              src="https://static.wixstatic.com/media/1a4736_ad22f191e98e4fb1a0d013093676fccf~mv2.jpg/v1/fill/w_160,h_90,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1a4736_ad22f191e98e4fb1a0d013093676fccf~mv2.jpg" 
              alt="CEDOI Logo" 
              className="w-full h-full object-contain rounded"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="material-icons text-primary text-lg sm:text-xl hidden">groups</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-medium truncate">CEDOI Madurai</h1>
            <p className="text-xs sm:text-sm opacity-90 capitalize truncate">{user?.role || 'Member'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="p-1.5 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white w-8 h-8 sm:w-10 sm:h-10"
          >
            <span className="material-icons text-lg sm:text-xl">notifications</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white w-8 h-8 sm:w-10 sm:h-10"
          >
            <span className="material-icons text-lg sm:text-xl">logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

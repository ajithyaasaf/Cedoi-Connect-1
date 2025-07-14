import React from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary text-white p-3 sm:p-4 shadow-material safe-area-pt">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-white text-lg sm:text-xl">groups</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-medium truncate">CEDOI Forum</h1>
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

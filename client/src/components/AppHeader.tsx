import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import NotificationCenter from './NotificationCenter';
import cedoiLogo from '@assets/Logo_1753037717604.png';

interface AppHeaderProps {
  onMarkAttendance?: (meetingId: string) => void;
  onViewMeeting?: (meetingId: string) => void;
}

export default function AppHeader({ onMarkAttendance, onViewMeeting }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  return (
    <header className="bg-gradient-to-r from-primary via-blue-700 to-indigo-800 text-white p-3 sm:p-4 shadow-xl safe-area-pt relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
      <div className="flex items-center justify-between max-w-screen-xl mx-auto relative z-10">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="relative">
            <img 
              src={cedoiLogo} 
              alt="CEDOI Logo" 
              className="h-8 sm:h-10 w-auto object-contain flex-shrink-0 rounded-lg shadow-md bg-white/10 p-1"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="material-icons text-white text-lg sm:text-xl hidden bg-white/10 rounded-lg p-2">groups</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">CEDOI Madurai</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs sm:text-sm text-blue-100 capitalize truncate font-medium">
                {user?.role === 'sonai' ? 'Organizer' : user?.role || 'Member'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="[&_button]:text-white [&_button]:hover:bg-white/20 [&_span]:text-white">
            <NotificationCenter 
              onMarkAttendance={onMarkAttendance}
              onViewMeeting={onViewMeeting}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                await logout();
                toast({
                  title: "Logged out successfully",
                  description: "See you next time!",
                });
              } catch (error) {
                toast({
                  title: "Logout error",
                  description: "You have been logged out anyway",
                  variant: "destructive",
                });
              } finally {
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 text-white w-10 h-10 disabled:opacity-50 hover:scale-110 disabled:hover:scale-100"
          >
            <span className={`material-icons text-lg transition-transform duration-200 ${isLoggingOut ? 'animate-spin' : ''}`}>
              {isLoggingOut ? 'refresh' : 'logout'}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}

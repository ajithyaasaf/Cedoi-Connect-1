import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationCenter from './NotificationCenter';
import cedoiLogo from '@assets/Logo_1753037717604.png';

interface MobileAppHeaderProps {
  onMarkAttendance?: (meetingId: string) => void;
  onViewMeeting?: (meetingId: string) => void;
}

export default function MobileAppHeader({ onMarkAttendance, onViewMeeting }: MobileAppHeaderProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 safe-area-pt">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={cedoiLogo} 
              alt="CEDOI Logo" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="h-12 w-12 bg-[#0c5b84] rounded-lg flex items-center justify-center hidden">
              <span className="material-icons text-white text-sm">groups</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <NotificationCenter 
            onMarkAttendance={onMarkAttendance}
            onViewMeeting={onViewMeeting}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 cursor-pointer ring-2 ring-transparent hover:ring-[#0c5b84]/20 transition-all">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#0c5b84] to-[#0a5472] text-white font-medium text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-0 shadow-lg">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role === 'sonai' ? 'Organizer' : user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                <span className="material-icons text-sm mr-2">person</span>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/settings')}>
                <span className="material-icons text-sm mr-2">settings</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/help-support')}>
                <span className="material-icons text-sm mr-2">help</span>
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
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
                className="text-red-600 focus:text-red-600"
              >
                <span className="material-icons text-sm mr-2">logout</span>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
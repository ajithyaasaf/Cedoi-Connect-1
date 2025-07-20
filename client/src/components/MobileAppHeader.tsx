import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import cedoiLogo from '@assets/image_1752498683514.png';

export default function MobileAppHeader() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

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
              className="w-10 h-10 object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hidden">
              <span className="material-icons text-white text-lg">groups</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CEDOI Forum</h1>
            <p className="text-sm text-gray-500">Meeting Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-2xl relative hover:bg-gray-100"
          >
            <span className="material-icons text-xl text-gray-600">notifications</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 cursor-pointer ring-2 ring-transparent hover:ring-blue-200 transition-all">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium text-sm">
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
              <DropdownMenuItem>
                <span className="material-icons text-sm mr-2">person</span>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="material-icons text-sm mr-2">settings</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
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
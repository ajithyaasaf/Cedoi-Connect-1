import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary text-white p-4 shadow-material">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <span className="material-icons text-white">groups</span>
          </div>
          <div>
            <h1 className="text-xl font-medium">CEDOI Forum</h1>
            <p className="text-sm opacity-90 capitalize">{user?.role || 'Member'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
          >
            <span className="material-icons">notifications</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
          >
            <span className="material-icons">logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

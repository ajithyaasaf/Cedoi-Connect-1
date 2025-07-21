import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', icon: 'home', label: 'Home', badge: null },
  { id: 'meetings', icon: 'event', label: 'Meetings', badge: null },
  { id: 'attendance', icon: 'fact_check', label: 'Attendance', badge: null },
  { id: 'reports', icon: 'analytics', label: 'Reports', badge: null },
  { id: 'settings', icon: 'settings', label: 'Settings', badge: null },
];

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-0 flex-1 transition-all duration-200 ${
                isActive
                  ? 'bg-[#0c5b84]/10 text-[#0c5b84]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <span className={`material-icons text-xl transition-all duration-200 ${
                  isActive ? 'text-[#0c5b84]' : 'text-gray-600'
                }`}>
                  {item.icon}
                </span>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs font-medium mt-1 truncate transition-all duration-200 ${
                isActive ? 'text-[#0c5b84]' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
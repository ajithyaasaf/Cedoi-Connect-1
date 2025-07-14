import { Button } from '@/components/ui/button';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'attendance', label: 'Attendance', icon: 'how_to_reg' },
    { id: 'reports', label: 'Reports', icon: 'assessment' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 px-4 flex flex-col items-center justify-center space-y-1 transition-colors ${
              activeTab === tab.id ? 'text-accent' : 'text-gray-500'
            }`}
          >
            <span className="material-icons text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}

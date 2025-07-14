import React from 'react';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
      <div className="flex max-w-screen-xl mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-center justify-center space-y-1 transition-colors min-h-[60px] sm:min-h-[70px] ${
              activeTab === tab.id 
                ? 'text-accent bg-accent/10' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span className="material-icons bottom-nav-icon text-lg sm:text-xl">{tab.icon}</span>
            <span className="bottom-nav-text text-xs sm:text-sm font-medium leading-tight">{tab.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}

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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 z-50 safe-area-pb shadow-xl">
      <div className="flex max-w-screen-xl mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-center justify-center space-y-1 transition-all duration-200 min-h-[60px] sm:min-h-[70px] rounded-none hover:bg-transparent ${
              activeTab === tab.id 
                ? 'text-accent bg-gradient-to-t from-accent/20 to-transparent' 
                : 'text-gray-500 dark:text-gray-400 hover:text-accent dark:hover:text-accent hover:bg-accent/5'
            }`}
          >
            <div className={`transition-all duration-200 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`}>
              <span className="material-icons bottom-nav-icon text-lg sm:text-xl">{tab.icon}</span>
            </div>
            <span className={`bottom-nav-text text-xs sm:text-sm font-medium leading-tight transition-all duration-200 ${
              activeTab === tab.id ? 'font-semibold' : 'font-medium'
            }`}>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-accent rounded-t-full"></div>
            )}
          </Button>
        ))}
      </div>
    </nav>
  );
}

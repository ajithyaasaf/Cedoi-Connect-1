import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import AuthForm from '@/components/AuthForm';
import AppHeader from '@/components/AppHeader';
import Dashboard from '@/components/Dashboard';
import AttendanceScreenImproved from '@/components/AttendanceScreenImproved';
import AttendanceLandingScreen from '@/components/AttendanceLandingScreen';
import ReportsEnhanced from '@/components/ReportsEnhanced';
import SettingsScreen from '@/components/SettingsScreen';
import CreateMeetingScreen from '@/components/CreateMeetingScreen';
import BottomNavigation from '@/components/BottomNavigation';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-2xl">groups</span>
          </div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleCreateMeeting = () => {
    setActiveTab('create-meeting');
  };

  const handleMarkAttendance = (meetingId: string) => {
    setAttendanceMeetingId(meetingId);
    setActiveTab('attendance-marking');
  };

  const handleSelectMeetingForAttendance = (meetingId: string) => {
    setAttendanceMeetingId(meetingId);
    setActiveTab('attendance-marking');
  };

  const handleBackToDashboard = () => {
    setActiveTab('dashboard');
    setAttendanceMeetingId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onCreateMeeting={handleCreateMeeting}
            onMarkAttendance={handleMarkAttendance}
          />
        );
      case 'attendance':
        return (
          <AttendanceLandingScreen
            onSelectMeeting={handleSelectMeetingForAttendance}
          />
        );
      case 'attendance-marking':
        return attendanceMeetingId ? (
          <AttendanceScreenImproved
            meetingId={attendanceMeetingId}
            onBack={handleBackToDashboard}
          />
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-600">No meeting selected for attendance</p>
          </div>
        );
      case 'reports':
        return <ReportsEnhanced onBack={handleBackToDashboard} />;
      case 'create-meeting':
        return <CreateMeetingScreen onBack={handleBackToDashboard} />;
      case 'settings':
        return <SettingsScreen onBack={handleBackToDashboard} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pb-20">
        {renderContent()}
      </main>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

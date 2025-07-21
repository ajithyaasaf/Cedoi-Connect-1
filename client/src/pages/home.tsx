import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import AuthForm from '@/components/AuthForm';
import AppHeader from '@/components/AppHeader';
import MobileAppHeader from '@/components/MobileAppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Dashboard from '@/components/Dashboard';
import MobileHomePage from '@/components/MobileHomePage';
import MeetingsPage from '@/components/MeetingsPage';
import AttendanceScreenImproved from '@/components/AttendanceScreenImproved';
import AttendanceLandingScreen from '@/components/AttendanceLandingScreen';
import ReportsEnhanced from '@/components/ReportsEnhanced';
import SettingsScreen from '@/components/SettingsScreen';
import CreateMeetingScreen from '@/components/CreateMeetingScreen';
import LiveAttendanceMonitorEnhanced from '@/components/LiveAttendanceMonitorEnhanced';
import logoImage from '@assets/Logo_1753077321270.png';
import BottomNavigation from '@/components/BottomNavigation';
export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string | null>(null);
  const [liveMonitorMeetingId, setLiveMonitorMeetingId] = useState<string | null>(null);
  const [useMobileDesign, setUseMobileDesign] = useState(true); // Toggle for mobile design

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logoImage} 
            alt="CEDOI Logo" 
            className="h-20 w-auto mx-auto mb-4"
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 hidden">
            <span className="material-icons text-white text-2xl">groups</span>
          </div>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-foreground">Loading CEDOI Forum...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleCreateMeeting = () => {
    // Only allow Chairman users to create meetings
    if (user?.role === 'chairman') {
      setActiveTab('create-meeting');
    } else {
      // Show access denied message or redirect back
      console.warn('Access denied: Only Chairman users can create meetings');
    }
  };

  const handleMarkAttendance = (meetingId: string) => {
    setAttendanceMeetingId(meetingId);
    setActiveTab('attendance-marking');
  };

  const handleSelectMeetingForAttendance = (meetingId: string) => {
    setAttendanceMeetingId(meetingId);
    setActiveTab('attendance-marking');
  };

  const handleViewLiveAttendance = (meetingId: string) => {
    setLiveMonitorMeetingId(meetingId);
    setActiveTab('live-monitor');
  };

  const handleBackToDashboard = () => {
    setActiveTab('dashboard');
    setAttendanceMeetingId(null);
    setLiveMonitorMeetingId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <MobileHomePage
            onCreateMeeting={handleCreateMeeting}
            onMarkAttendance={handleMarkAttendance}
            onViewLiveAttendance={handleViewLiveAttendance}
          />
        );
      case 'meetings':
        return (
          <MeetingsPage
            onCreateMeeting={handleCreateMeeting}
            onMarkAttendance={handleMarkAttendance}
            onViewLiveAttendance={handleViewLiveAttendance}
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
        // Double-check role protection at route level
        return user?.role === 'chairman' ? (
          <CreateMeetingScreen onBack={handleBackToDashboard} />
        ) : (
          <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
            <div className="text-center p-6">
              <span className="material-icons text-6xl text-red-400 mb-4 block">block</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">Only Chairman users can create meetings.</p>
              <Button
                onClick={handleBackToDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
              >
                <span className="material-icons text-sm mr-2">arrow_back</span>
                Go Back
              </Button>
            </div>
          </div>
        );
      case 'live-monitor':
        return liveMonitorMeetingId ? (
          <LiveAttendanceMonitorEnhanced
            meetingId={liveMonitorMeetingId}
            onBack={handleBackToDashboard}
          />
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-600">No meeting selected for live monitoring</p>
          </div>
        );
      case 'settings':
        return <SettingsScreen onBack={handleBackToDashboard} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileAppHeader 
        onMarkAttendance={handleMarkAttendance}
        onViewMeeting={handleSelectMeetingForAttendance}
      />
      
      <main className="pb-20">
        {renderContent()}
      </main>
      
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

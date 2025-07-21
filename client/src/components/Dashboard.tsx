import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { safeAgenda, safeText, safeRender } from '@/lib/render-safety';
import type { Meeting, User } from '@shared/schema';

// Component to show attendance stats for a specific meeting
function AttendanceStats({ meetingId }: { meetingId: string }) {
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', meetingId],
    queryFn: () => api.attendance.getForMeeting(meetingId),
    refetchInterval: 15000, // Auto-refresh every 15 seconds for live stats
    refetchOnWindowFocus: true,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
    refetchInterval: 60000, // Refresh users every minute
    refetchOnWindowFocus: true,
  });

  const totalMembers = users.filter(u => u.role === 'member' || u.role === 'sonai').length;
  
  // Create a map to avoid duplicate records per user
  const attendanceMap = new Map();
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.userId, record.status);
  });
  
  // Count unique users who are marked as present
  const presentCount = Array.from(attendanceMap.values()).filter(status => status === 'present').length;
  const totalMarked = attendanceMap.size; // Unique users marked (present + absent)
  
  // Calculate both attendance rate and completion rate - cap at 100%
  const attendancePercentage = totalMembers > 0 ? Math.min(100, Math.round((presentCount / totalMembers) * 100)) : 0;
  const completionPercentage = totalMembers > 0 ? Math.min(100, Math.round((totalMarked / totalMembers) * 100)) : 0;
  
  // Determine what to show based on completion status
  const isCompleted = completionPercentage >= 80; // Consider completed when 80%+ marked
  const showAttendanceRate = isCompleted || totalMarked > 0;

  return (
    <>
      {showAttendanceRate ? (
        <>
          <div className={`text-sm font-medium ${attendancePercentage >= 70 ? 'text-green-600' : attendancePercentage >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
            {attendancePercentage}%
          </div>
          <div className="text-xs text-gray-500">
            {isCompleted ? 'attendance' : `attendance (${completionPercentage}% marked)`}
          </div>
        </>
      ) : (
        <>
          <div className="text-sm font-medium text-gray-400">
            {completionPercentage}%
          </div>
          <div className="text-xs text-gray-500">marking progress</div>
        </>
      )}
    </>
  );
}

interface DashboardProps {
  onCreateMeeting: () => void;
  onMarkAttendance: (meetingId: string) => void;
  onViewLiveAttendance: (meetingId: string) => void;
}

export default function Dashboard({ onCreateMeeting, onMarkAttendance, onViewLiveAttendance }: DashboardProps) {
  const { user } = useAuth();
  
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      console.log('Fetching meetings...');
      const result = await api.meetings.getAll();
      console.log('Meetings fetched:', result);
      return result;
    },
  });

  const { data: todaysMeeting } = useQuery<Meeting | null>({
    queryKey: ['meetings', 'today'],
    queryFn: async () => {
      console.log('Dashboard: Fetching today\'s meeting...');
      const result = await api.meetings.getTodaysMeeting();
      console.log('Dashboard: Today\'s meeting result:', result);
      return result;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true, // Refresh when window gains focus
  });

  const { data: stats } = useQuery<{
    totalMeetings: number;
    averageAttendance: number;
    presentCount: number;
    absentCount: number;
  }>({
    queryKey: ['stats'],
    queryFn: () => api.attendance.getStats(),
  });

  // Filter meetings based on user role and status
  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.date) > new Date()
  );

  const completedMeetings = meetings.filter(meeting => 
    new Date(meeting.date) <= new Date()
  );

  // For Organizer/Sonai - show only their assigned meetings
  const organizerUpcomingMeetings = user?.role === 'sonai' ? 
    upcomingMeetings.filter(meeting => meeting.createdBy === user.id) : [];
  
  const organizerCompletedMeetings = user?.role === 'sonai' ? 
    completedMeetings.filter(meeting => meeting.createdBy === user.id) : [];

  // For Chairman - show all meetings
  const chairmanUpcomingMeetings = user?.role === 'chairman' ? upcomingMeetings : [];
  const chairmanCompletedMeetings = user?.role === 'chairman' ? completedMeetings : [];

  // For regular display
  const displayUpcomingMeetings = upcomingMeetings.slice(0, 3);
  const displayRecentMeetings = completedMeetings.slice(0, 3);

  return (
    <div className="p-4 pb-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Welcome back!</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="material-icons text-white text-lg">person</span>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-[#085886] to-[#0a5e78] text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-lg">event</span>
              </div>
              <span className="text-xs text-white/70 uppercase tracking-wide font-medium">THIS WEEK</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {upcomingMeetings.length}
            </div>
            <div className="text-sm text-white/70">Meetings</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="material-icons text-white text-lg">people</span>
              </div>
              <span className="text-xs text-green-100 uppercase tracking-wide font-medium">AVERAGE</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {stats?.averageAttendance || 0}%
            </div>
            <div className="text-sm text-green-100">Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meeting Card */}
      {todaysMeeting && (
        <Card className="mb-8 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="material-icons text-white text-xl">today</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Today's Meeting</h3>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-sm text-blue-100">Active Now</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white bg-opacity-25 px-4 py-2 rounded-full">
                    <span className="text-sm font-semibold">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <p className="text-sm text-white/70 mb-1">
                  {new Date(todaysMeeting.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-lg font-medium">
                  {new Date(todaysMeeting.date).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {/* Location */}
            <div className="flex items-center mb-6 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-[#085886] to-[#0a5e78] rounded-full flex items-center justify-center mr-3">
                <span className="material-icons text-white text-sm">location_on</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-foreground">{safeText(todaysMeeting.venue, 'Venue TBD')}</p>
              </div>
            </div>
            
            {/* Agenda */}
            <div className="mb-6 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-lg">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="material-icons text-white text-sm">description</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Agenda</p>
                  <p className="text-sm text-foreground leading-relaxed">{safeAgenda(todaysMeeting.theme)}</p>
                </div>
              </div>
            </div>
            
            {/* Live Attendance */}
            <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-2">
                    <span className="material-icons text-white text-sm">people</span>
                  </div>
                  <h4 className="font-semibold text-foreground">Live Attendance</h4>
                </div>
                <AttendanceStats meetingId={todaysMeeting.id} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Auto-refresh • Every 30s
                </span>
                <span>Updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Meeting Active</span>
              </div>
              <div className="flex space-x-3">
                {user?.role === 'chairman' && (
                  <Button
                    onClick={() => {
                      console.log('Dashboard: Clicking Live Status for meeting ID:', todaysMeeting.id);
                      console.log('Dashboard: Today\'s meeting object:', todaysMeeting);
                      onViewLiveAttendance(todaysMeeting.id);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <span className="material-icons text-sm mr-2">visibility</span>
                    Live Monitor
                  </Button>
                )}
                {user?.role === 'sonai' && (
                  <Button
                    onClick={() => onMarkAttendance(todaysMeeting.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <span className="material-icons text-sm mr-2">how_to_reg</span>
                    Mark Attendance
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-specific Meeting Management */}
      {user?.role === 'sonai' && (
        <>
          {/* Organizer's Assigned Meetings */}
          <Card className="mb-8 overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-0">
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="material-icons text-white text-xl">assignment</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">My Organized Meetings</h3>
                    <p className="text-emerald-100 text-sm">Meetings you're responsible for</p>
                  </div>
                </div>
              </div>
              
              {/* Upcoming Meetings */}
              <div className="p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="material-icons text-blue-600 text-sm">schedule</span>
                  </div>
                  Upcoming ({organizerUpcomingMeetings.length})
                </h4>
                
                {organizerUpcomingMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="material-icons text-gray-400 text-2xl">event</span>
                    </div>
                    <p className="text-gray-500 text-sm">No upcoming meetings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {organizerUpcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="bg-gradient-to-r from-[#085886]/10 to-[#0a5e78]/10 dark:from-[#085886]/20 dark:to-[#0a5e78]/20 p-4 rounded-xl border border-[#085886]/20 dark:border-[#085886]/30 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#085886] to-[#0a5e78] rounded-full flex items-center justify-center">
                              <span className="material-icons text-white text-sm">event</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-foreground">Weekly Meeting</h5>
                              <div className="flex items-center space-x-1 mt-1 text-xs text-[#085886] dark:text-[#085886]/80">
                                <span className="material-icons text-xs">schedule</span>
                                <span>
                                  {new Date(meeting.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })} • {new Date(meeting.date).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <span className="material-icons text-xs">location_on</span>
                                <span>{safeText(meeting.venue, 'Venue TBD')}</span>
                              </div>
                              {meeting.theme && (
                                <div className="flex items-start space-x-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                  <span className="material-icons text-xs mt-0.5">description</span>
                                  <span className="line-clamp-2">{safeAgenda(meeting.theme)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => onMarkAttendance(meeting.id)}
                            className="bg-gradient-to-r from-[#085886] to-[#0a5e78] hover:from-[#0a5e78] hover:to-[#0c6b8c] text-white shadow-md hover:shadow-lg transition-all duration-200 ml-3"
                            size="sm"
                          >
                            <span className="material-icons text-sm mr-1">how_to_reg</span>
                            Mark
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Completed Meetings */}
              <div className="p-4 border-t border-gray-100">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  Completed ({organizerCompletedMeetings.length})
                </h4>
                
                {organizerCompletedMeetings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No completed meetings</p>
                ) : (
                  <div className="space-y-2">
                    {organizerCompletedMeetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-foreground">Weekly Meeting</h5>
                            <p className="text-sm text-gray-600">
                              {new Date(meeting.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {new Date(meeting.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            <p className="text-xs text-gray-500">{safeText(meeting.venue, 'Venue TBD')}</p>
                            {meeting.theme && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="material-icons text-xs mr-1">description</span>
                                {safeAgenda(meeting.theme)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <AttendanceStats meetingId={meeting.id} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {user?.role === 'chairman' && (
        <>
          {/* Chairman's Meeting Overview */}
          <Card className="shadow-material mb-6">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-foreground">Meeting Overview</h3>
              </div>
              
              {/* All Upcoming Meetings */}
              <div className="p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <span className="material-icons text-[#085886] mr-2">event_upcoming</span>
                  All Upcoming Meetings ({chairmanUpcomingMeetings.length})
                </h4>
                
                {chairmanUpcomingMeetings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming meetings</p>
                ) : (
                  <div className="space-y-2">
                    {chairmanUpcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="bg-[#085886]/10 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-foreground">Weekly Meeting</h5>
                            <p className="text-sm text-gray-600">
                              {new Date(meeting.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {new Date(meeting.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            <p className="text-xs text-gray-500">{safeText(meeting.venue, 'Venue TBD')}</p>
                            {meeting.theme && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="material-icons text-xs mr-1">description</span>
                                {safeAgenda(meeting.theme)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Assigned to Organizer</div>
                            <div className="text-xs bg-[#085886]/10 text-[#085886] px-2 py-1 rounded-full">Upcoming</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* All Completed Meetings */}
              <div className="p-4 border-t border-gray-100">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <span className="material-icons text-green-500 mr-2">history</span>
                  Meeting History ({chairmanCompletedMeetings.length})
                </h4>
                
                {chairmanCompletedMeetings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No completed meetings</p>
                ) : (
                  <div className="space-y-2">
                    {chairmanCompletedMeetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-foreground">Weekly Meeting</h5>
                            <p className="text-sm text-gray-600">
                              {new Date(meeting.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {new Date(meeting.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            <p className="text-xs text-gray-500">{meeting.venue}</p>
                            {meeting.theme && (
                              <p className="text-xs text-gray-500 mt-1">
                                <span className="material-icons text-xs mr-1">description</span>
                                {meeting.theme}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <AttendanceStats meetingId={meeting.id} />
                            <div className="text-xs bg-green-100 px-2 py-1 rounded-full mt-1">Completed</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Members' Meeting View */}
      {user?.role === 'member' && (
        <>
          {/* Upcoming Meetings for Members */}
          <Card className="shadow-material mb-6">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-foreground">Upcoming Meetings</h3>
              </div>
              
              <div className="p-4">
                {upcomingMeetings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming meetings scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="bg-[#085886]/10 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">Weekly Meeting</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(meeting.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {new Date(meeting.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <span className="material-icons text-xs mr-1">location_on</span>
                              {meeting.venue}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs bg-[#085886]/10 text-[#085886] px-2 py-1 rounded-full">Upcoming</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Meetings for Members */}
          <Card className="shadow-material mb-6">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-foreground">Recent Meetings</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {displayRecentMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                          <span className="material-icons text-white text-sm">event</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Weekly Meeting</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(meeting.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <AttendanceStats meetingId={meeting.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Floating Action Button */}
      {user?.role === 'chairman' && user?.email?.includes('chairman') && (
        <Button
          onClick={onCreateMeeting}
          className="floating-action-button w-14 h-14 bg-accent hover:bg-accent/90 text-white rounded-full shadow-material-lg ripple"
        >
          <span className="material-icons">add</span>
        </Button>
      )}
    </div>
  );
}

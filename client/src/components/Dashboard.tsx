import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { Meeting, User } from '@shared/schema';

// Component to show attendance stats for a specific meeting
function AttendanceStats({ meetingId }: { meetingId: string }) {
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', meetingId],
    queryFn: () => api.attendance.getForMeeting(meetingId),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  const totalMembers = users.filter(u => u.role === 'member' || u.role === 'sonai').length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const attendancePercentage = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

  return (
    <>
      <div className="text-sm font-medium text-success">{attendancePercentage}%</div>
      <div className="text-xs text-gray-500">attendance</div>
    </>
  );
}

interface DashboardProps {
  onCreateMeeting: () => void;
  onMarkAttendance: (meetingId: string) => void;
}

export default function Dashboard({ onCreateMeeting, onMarkAttendance }: DashboardProps) {
  const { user } = useAuth();
  
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.getAll(),
  });

  const { data: todaysMeeting } = useQuery<Meeting | null>({
    queryKey: ['meetings', 'today'],
    queryFn: () => api.meetings.getTodaysMeeting(),
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

  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.date) > new Date()
  ).slice(0, 3);

  const recentMeetings = meetings.filter(meeting => 
    new Date(meeting.date) <= new Date()
  ).slice(0, 3);

  return (
    <div className="p-4 pb-20">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="shadow-material">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="material-icons text-accent">event</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">THIS WEEK</span>
            </div>
            <div className="text-2xl font-semibold text-primary">
              {upcomingMeetings.length}
            </div>
            <div className="text-sm text-gray-600">Meetings</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-material">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="material-icons text-success">people</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">AVERAGE</span>
            </div>
            <div className="text-2xl font-semibold text-primary">
              {stats?.averageAttendance || 0}%
            </div>
            <div className="text-sm text-gray-600">Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meeting Card */}
      {todaysMeeting && (
        <Card className="shadow-material mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-800 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">Today's Meeting</h3>
                <p className="text-sm opacity-90">
                  {new Date(todaysMeeting.date).toLocaleDateString()} - {new Date(todaysMeeting.date).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-medium">
                  ACTIVE
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <span className="material-icons text-gray-500 mr-2">location_on</span>
              <span className="text-sm text-gray-700">{todaysMeeting.venue}</span>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Agenda</h4>
              <p className="text-sm text-gray-600">{todaysMeeting.agenda}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-icons text-success mr-2">check_circle</span>
                <span className="text-sm text-gray-700">Meeting Active</span>
              </div>
              {user?.role === 'sonai' && (
                <Button
                  onClick={() => onMarkAttendance(todaysMeeting.id)}
                  className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
                >
                  MARK ATTENDANCE
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Meetings */}
      <Card className="shadow-material mb-6">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-foreground">Recent Meetings</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentMeetings.map((meeting) => (
              <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                      <span className="material-icons text-white text-sm">event</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Weekly Meeting</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(meeting.date).toLocaleDateString()}
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

      {/* Floating Action Button */}
      {user?.role === 'sonai' && (
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

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Meeting, User, AttendanceRecord } from '@shared/schema';
import logoImage from '@assets/Logo_1753077321270.png';

interface LiveAttendanceMonitorProps {
  meetingId: string;
  onBack: () => void;
}

export default function LiveAttendanceMonitor({ meetingId, onBack }: LiveAttendanceMonitorProps) {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get meeting details
  const { data: meeting } = useQuery({
    queryKey: ['meetings', meetingId],
    queryFn: async () => {
      const meetings = await api.meetings.getAll();
      return meetings.find(m => m.id === meetingId) || null;
    },
  });

  // Get all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  // Get attendance records with auto-refresh
  const { data: attendanceRecords = [], refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', meetingId],
    queryFn: () => api.attendance.getForMeeting(meetingId),
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Manual refresh function
  const handleRefresh = async () => {
    await refetchAttendance();
    setLastUpdate(new Date());
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logoImage} 
            alt="CEDOI Logo" 
            className="h-16 w-auto mx-auto mb-4 opacity-50"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 hidden opacity-50">
            <span className="material-icons text-gray-600 text-lg">groups</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Meeting not found</h2>
          <Button onClick={onBack} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const members = users.filter(u => u.role === 'member' || u.role === 'sonai');
  const attendanceMap = new Map(attendanceRecords.map(record => [record.userId, record.status]));
  
  const presentMembers = members.filter(member => attendanceMap.get(member.id) === 'present');
  const absentMembers = members.filter(member => attendanceMap.get(member.id) === 'absent');
  const pendingMembers = members.filter(member => !attendanceMap.has(member.id));
  
  const totalMembers = members.length;
  const presentCount = presentMembers.length;
  const absentCount = absentMembers.length;
  const pendingCount = pendingMembers.length;
  const completionPercentage = totalMembers > 0 ? Math.round(((presentCount + absentCount) / totalMembers) * 100) : 0;
  const attendancePercentage = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

  const getMemberStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberStatusText = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="touch-target"
              >
                <span className="material-icons">arrow_back</span>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Live Attendance Monitor</h1>
                <p className="text-sm text-gray-600">
                  {new Date(meeting.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="touch-target"
              >
                <span className="material-icons mr-1">refresh</span>
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="touch-target"
              >
                <span className="material-icons mr-1">
                  {autoRefresh ? 'pause' : 'play_arrow'}
                </span>
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Meeting Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Meeting Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="material-icons mr-2 text-base">schedule</span>
                    {new Date(meeting.date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                  <div className="flex items-center">
                    <span className="material-icons mr-2 text-base">location_on</span>
                    {meeting.venue}
                  </div>
                  {meeting.theme && (
                    <div className="flex items-start">
                      <span className="material-icons mr-2 text-base">description</span>
                      <span>{meeting.theme}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ACTIVE
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{totalMembers}</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{presentCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion Progress</span>
                <span className="text-sm font-semibold">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Attendance Rate</span>
                <span className="text-sm font-semibold">{attendancePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Status Lists */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Present Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-green-600 flex items-center">
                <span className="material-icons mr-2">check_circle</span>
                Present ({presentCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {presentMembers.map(member => (
                  <div key={member.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.company}</div>
                    </div>
                    <Badge className={getMemberStatusColor('present')}>
                      {getMemberStatusText('present')}
                    </Badge>
                  </div>
                ))}
                {presentMembers.length === 0 && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No members present yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Absent Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-red-600 flex items-center">
                <span className="material-icons mr-2">cancel</span>
                Absent ({absentCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {absentMembers.map(member => (
                  <div key={member.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.company}</div>
                    </div>
                    <Badge className={getMemberStatusColor('absent')}>
                      {getMemberStatusText('absent')}
                    </Badge>
                  </div>
                ))}
                {absentMembers.length === 0 && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No members marked absent
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-orange-600 flex items-center">
                <span className="material-icons mr-2">schedule</span>
                Pending ({pendingCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {pendingMembers.map(member => (
                  <div key={member.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.company}</div>
                    </div>
                    <Badge className={getMemberStatusColor(undefined)}>
                      {getMemberStatusText(undefined)}
                    </Badge>
                  </div>
                ))}
                {pendingMembers.length === 0 && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    All members have been marked
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Button */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Export Current Status</h3>
                <p className="text-sm text-gray-600">Download attendance report as of now</p>
              </div>
              <Button
                onClick={() => {
                  // Export functionality can be added here
                  alert('Export functionality will be implemented');
                }}
                variant="outline"
              >
                <span className="material-icons mr-2">download</span>
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Meeting, User, AttendanceRecord } from '@shared/schema';

interface LiveAttendanceMonitorEnhancedProps {
  meetingId: string;
  onBack: () => void;
}

export default function LiveAttendanceMonitorEnhanced({ meetingId, onBack }: LiveAttendanceMonitorEnhancedProps) {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'present' | 'absent' | 'pending'>('overview');

  // Get meeting details
  const { data: meeting, isLoading: meetingLoading, error: meetingError } = useQuery({
    queryKey: ['meetings', meetingId],
    queryFn: async () => {
      console.log('LiveAttendanceMonitor: Looking for meeting with ID:', meetingId);
      const meetings = await api.meetings.getAll();
      console.log('LiveAttendanceMonitor: All meetings:', meetings);
      const foundMeeting = meetings.find(m => m.id === meetingId);
      console.log('LiveAttendanceMonitor: Found meeting:', foundMeeting);
      return foundMeeting || null;
    },
    refetchInterval: 30000, // Refresh meeting details every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Get all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
    refetchInterval: 60000, // Refresh users every minute
  });

  // Get attendance records with auto-refresh
  const { data: attendanceRecords = [], refetch: refetchAttendance, isFetching } = useQuery({
    queryKey: ['attendance', meetingId],
    queryFn: () => api.attendance.getForMeeting(meetingId),
    refetchInterval: autoRefresh ? 15000 : false, // Refresh every 15 seconds for more responsive updates
    refetchOnWindowFocus: true,
  });

  // Manual refresh function
  const handleRefresh = async () => {
    await refetchAttendance();
    setLastUpdate(new Date());
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      setLastUpdate(new Date());
    }
  }, [attendanceRecords]);

  if (meetingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="material-icons text-blue-500 text-2xl">hourglass_empty</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading Meeting...</h2>
            <p className="text-gray-600">Please wait while we load the meeting details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (meetingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-orange-500 text-2xl">warning</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Meeting</h2>
            <p className="text-gray-600 mb-6">There was an error loading the meeting data. Meeting ID: {meetingId}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Retry
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-500 text-2xl">error_outline</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Meeting Not Found</h2>
            <p className="text-gray-600 mb-4">The meeting you're looking for doesn't exist.</p>
            <p className="text-xs text-gray-500 mb-6">Meeting ID: {meetingId}</p>
            <Button onClick={onBack} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
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

  const getFilteredMembers = () => {
    switch (selectedView) {
      case 'present':
        return presentMembers;
      case 'absent':
        return absentMembers;
      case 'pending':
        return pendingMembers;
      default:
        return members;
    }
  };

  const getViewTitle = () => {
    switch (selectedView) {
      case 'present':
        return `Present Members (${presentCount})`;
      case 'absent':
        return `Absent Members (${absentCount})`;
      case 'pending':
        return `Pending Members (${pendingCount})`;
      default:
        return `All Members (${totalMembers})`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg sticky top-0 z-20 border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="material-icons text-gray-700">arrow_back</span>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  Live Attendance Monitor
                </h1>
                <p className="text-sm text-gray-600">
                  {new Date(meeting.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • {meeting.venue}
                </p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-xs"
              >
                <span className="material-icons text-sm mr-1">
                  {autoRefresh ? 'pause' : 'play_arrow'}
                </span>
                {autoRefresh ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
                className="text-xs"
              >
                <span className={`material-icons text-sm mr-1 ${isFetching ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                Refresh
              </Button>
            </div>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
              </span>
              <span className="text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            <Badge variant={isFetching ? "default" : "secondary"} className="text-xs">
              {isFetching ? 'Syncing...' : 'Up to date'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="p-4 space-y-6">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Present</p>
                  <p className="text-3xl font-bold">{presentCount}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-2xl">check_circle</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
                <p className="text-green-100 text-xs mt-1">{attendancePercentage}% attendance rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Absent</p>
                  <p className="text-3xl font-bold">{absentCount}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-2xl">cancel</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalMembers > 0 ? (absentCount / totalMembers) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-red-100 text-xs mt-1">
                  {totalMembers > 0 ? Math.round((absentCount / totalMembers) * 100) : 0}% absent rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-2xl">schedule</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalMembers > 0 ? (pendingCount / totalMembers) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-orange-100 text-xs mt-1">Awaiting attendance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total</p>
                  <p className="text-3xl font-bold">{totalMembers}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-2xl">people</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <p className="text-blue-100 text-xs mt-1">{completionPercentage}% completion</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Filter Buttons */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{getViewTitle()}</CardTitle>
              <div className="flex space-x-1">
                {[
                  { key: 'overview', label: 'All', icon: 'people' },
                  { key: 'present', label: 'Present', icon: 'check_circle', color: 'text-green-600' },
                  { key: 'absent', label: 'Absent', icon: 'cancel', color: 'text-red-600' },
                  { key: 'pending', label: 'Pending', icon: 'schedule', color: 'text-orange-600' }
                ].map(({ key, label, icon, color }) => (
                  <Button
                    key={key}
                    variant={selectedView === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedView(key as any)}
                    className={`text-xs ${selectedView === key ? '' : color || ''}`}
                  >
                    <span className="material-icons text-sm mr-1">{icon}</span>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Members List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredMembers().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-icons text-4xl mb-2 opacity-50">people_outline</span>
                  <p>No members in this category</p>
                </div>
              ) : (
                getFilteredMembers().map((member) => {
                  const status = attendanceMap.get(member.id);
                  const statusColor = status === 'present' ? 'text-green-600 bg-green-50' : 
                                    status === 'absent' ? 'text-red-600 bg-red-50' : 
                                    'text-orange-600 bg-orange-50';
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.company}</p>
                        </div>
                      </div>
                      <Badge 
                        className={`${statusColor} border-0 font-medium`}
                      >
                        <span className="material-icons text-sm mr-1">
                          {status === 'present' ? 'check_circle' : 
                           status === 'absent' ? 'cancel' : 'schedule'}
                        </span>
                        {status === 'present' ? 'Present' : 
                         status === 'absent' ? 'Absent' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Actions */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Export Current Status</h3>
                <p className="text-sm text-gray-600">Download attendance report for this meeting</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <span className="material-icons text-sm mr-1">file_download</span>
                  CSV Export
                </Button>
                <Button variant="outline" size="sm">
                  <span className="material-icons text-sm mr-1">print</span>
                  Print Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
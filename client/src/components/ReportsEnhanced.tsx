import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Meeting, User, AttendanceRecord } from '@shared/schema';

interface ReportsScreenProps {
  onBack: () => void;
}

export default function ReportsScreen({ onBack }: ReportsScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.getAll(),
  });

  // Filter meetings based on user role
  const userMeetings = user?.role === 'sonai' ? 
    meetings.filter(meeting => meeting.createdBy === user.id) : 
    meetings; // Chairman and members can see all meetings

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  const { data: allAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'all'],
    queryFn: async () => {
      const records = await Promise.all(
        meetings.map(meeting => api.attendance.getForMeeting(meeting.id))
      );
      return records.flat();
    },
    enabled: meetings.length > 0
  });

  // Filter data based on selected period
  const filteredMeetings = userMeetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return meetingDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return meetingDate >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return meetingDate >= quarterAgo;
      default:
        return true;
    }
  });

  // Calculate statistics
  const members = users.filter(user => user.role === 'member' || user.role === 'sonai');
  const totalMeetings = filteredMeetings.length;
  const totalPossibleAttendance = totalMeetings * members.length;
  const actualAttendance = allAttendance.filter(record => 
    record.status === 'present' && 
    filteredMeetings.some(meeting => meeting.id === record.meetingId)
  ).length;
  const overallAttendanceRate = totalPossibleAttendance > 0 ? 
    Math.round((actualAttendance / totalPossibleAttendance) * 100) : 0;

  // Member attendance stats
  const memberStats = members.map(member => {
    const memberAttendance = allAttendance.filter(record => 
      record.userId === member.id && 
      filteredMeetings.some(meeting => meeting.id === record.meetingId)
    );
    const presentCount = memberAttendance.filter(record => record.status === 'present').length;
    const attendanceRate = filteredMeetings.length > 0 ? 
      Math.round((presentCount / filteredMeetings.length) * 100) : 0;
    
    return {
      ...member,
      presentCount,
      totalMeetings: filteredMeetings.length,
      attendanceRate
    };
  }).sort((a, b) => b.attendanceRate - a.attendanceRate);

  const exportToCSV = () => {
    const csvData = [
      ['Name', 'Company', 'Role', 'Present', 'Total Meetings', 'Attendance Rate'],
      ...memberStats.map(member => [
        member.name,
        member.company,
        member.role,
        member.presentCount.toString(),
        member.totalMeetings.toString(),
        `${member.attendanceRate}%`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Attendance report has been downloaded as CSV.",
    });
  };

  // Role-based page title and subtitle
  const getPageTitle = () => {
    switch (user?.role) {
      case 'sonai':
        return 'My Meeting Reports';
      case 'chairman':
        return 'Organization Overview';
      default:
        return 'Meeting Reports';
    }
  };

  const getPageSubtitle = () => {
    switch (user?.role) {
      case 'sonai':
        return 'Track your meeting performance and member engagement';
      case 'chairman':
        return 'Monitor organizational health and meeting effectiveness';
      default:
        return 'View detailed attendance statistics';
    }
  };

  // Role-based header color
  const getHeaderColor = () => {
    switch (user?.role) {
      case 'sonai':
        return 'bg-blue-50 border-blue-200';
      case 'chairman':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className={`${getHeaderColor()} border-b p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <span className="material-icons">arrow_back</span>
            </Button>
            <div>
              <h1 className="text-xl font-medium text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-600">
                {getPageSubtitle()}
              </p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            className={`${user?.role === 'sonai' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white transition-colors`}
          >
            <span className="material-icons mr-2">download</span>
            {user?.role === 'sonai' ? 'Export My Reports' : 'Export All Reports'}
          </Button>
        </div>
      </div>

      <main className="p-4 pb-20">
        {/* Filters */}
        <Card className="shadow-material mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Filters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time Period
                </label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meeting
                </label>
                <Select value={selectedMeeting} onValueChange={setSelectedMeeting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Meetings</SelectItem>
                    {meetings.map(meeting => (
                      <SelectItem key={meeting.id} value={meeting.id}>
                        {new Date(meeting.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-Specific Statistics */}
        {user?.role === 'sonai' ? (
          // Sonai-specific statistics
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-material border-l-4 border-l-blue-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{totalMeetings}</div>
                <div className="text-sm text-gray-600">My Meetings</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-material border-l-4 border-l-green-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{overallAttendanceRate}%</div>
                <div className="text-sm text-gray-600">My Meeting Success</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-material border-l-4 border-l-orange-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{actualAttendance}</div>
                <div className="text-sm text-gray-600">Total Attendees</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Chairman-specific statistics
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-material border-l-4 border-l-purple-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{totalMeetings}</div>
                <div className="text-sm text-gray-600">Total Meetings</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-material border-l-4 border-l-green-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{overallAttendanceRate}%</div>
                <div className="text-sm text-gray-600">Organization Health</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-material border-l-4 border-l-blue-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{members.length}</div>
                <div className="text-sm text-gray-600">Active Members</div>
              </CardContent>
            </Card>

            <Card className="shadow-material border-l-4 border-l-orange-500">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {Math.round(actualAttendance / (totalMeetings || 1))}
                </div>
                <div className="text-sm text-gray-600">Avg per Meeting</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role-Specific Insights */}
        {user?.role === 'chairman' && (
          <Card className="shadow-material mb-6 border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-purple-700 mb-3">
                <span className="material-icons mr-2 align-middle">insights</span>
                Leadership Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Organization Health:</strong> {overallAttendanceRate >= 75 ? 'Excellent' : overallAttendanceRate >= 60 ? 'Good' : 'Needs Attention'}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Overall attendance rate of {overallAttendanceRate}%
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Meeting Frequency:</strong> {totalMeetings} meetings tracked
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Average {Math.round(actualAttendance / (totalMeetings || 1))} attendees per meeting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === 'sonai' && (
          <Card className="shadow-material mb-6 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-blue-700 mb-3">
                <span className="material-icons mr-2 align-middle">trending_up</span>
                My Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Meeting Success:</strong> {overallAttendanceRate >= 70 ? 'Excellent' : overallAttendanceRate >= 50 ? 'Good' : 'Improving'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {overallAttendanceRate}% attendance rate for your meetings
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Total Impact:</strong> {actualAttendance} member attendances
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Across {totalMeetings} meetings you organized
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Attendance Details */}
        <Card className="shadow-material">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-foreground">
                {user?.role === 'sonai' ? 'Your Meeting Attendees' : 'Member Attendance Overview'}
              </h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {memberStats.map((member) => (
                <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        member.attendanceRate >= 80 ? 'bg-success' :
                        member.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                      }`}>
                        <span className="material-icons text-white">person</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.company}</p>
                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        member.attendanceRate >= 80 ? 'text-success' :
                        member.attendanceRate >= 60 ? 'text-yellow-600' : 'text-destructive'
                      }`}>
                        {member.attendanceRate}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.presentCount}/{member.totalMeetings} meetings
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            member.attendanceRate >= 80 ? 'bg-success' :
                            member.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                          }`}
                          style={{ width: `${member.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
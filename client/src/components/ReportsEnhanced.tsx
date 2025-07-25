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

  // Filter data based on selected period and meeting
  const filteredMeetings = userMeetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    
    // Filter by specific meeting if selected
    if (selectedMeeting !== 'all' && meeting.id !== selectedMeeting) {
      return false;
    }
    
    // Filter by time period
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
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return meetingDate >= yearAgo;
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
        return 'bg-primary/5 border-primary/20';
      case 'chairman':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="w-10 h-10 rounded-2xl hover:bg-gray-100"
            >
              <span className="material-icons">arrow_back</span>
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-icons text-white text-lg">analytics</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-600">
                {getPageSubtitle()}
              </p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-4 py-2 transition-colors"
          >
            <span className="material-icons text-sm">download</span>
          </Button>
        </div>
      </div>

      <main className="px-4 py-4 pb-20">
        {/* Filters */}
        <Card className="shadow-lg border-0 rounded-2xl mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
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
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
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
                    {userMeetings.map(meeting => (
                      <SelectItem key={meeting.id} value={meeting.id}>
                        {new Date(meeting.date).toLocaleDateString()} - {meeting.venue}
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
            
            <Card className="shadow-material border-l-4 border-l-primary">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{members.length}</div>
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
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm text-primary">
                    <strong>Meeting Frequency:</strong> {totalMeetings} meetings tracked
                  </p>
                  <p className="text-xs text-primary/70 mt-1">
                    Average {Math.round(actualAttendance / (totalMeetings || 1))} attendees per meeting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === 'sonai' && (
          <Card className="shadow-material mb-6 border-l-4 border-l-primary">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-primary mb-3">
                <span className="material-icons mr-2 align-middle">trending_up</span>
                My Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm text-primary">
                    <strong>Meeting Success:</strong> {overallAttendanceRate >= 70 ? 'Excellent' : overallAttendanceRate >= 50 ? 'Good' : 'Improving'}
                  </p>
                  <p className="text-xs text-primary/70 mt-1">
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

        {/* Enhanced Member Attendance Overview */}
        <Card className="shadow-lg border-0 rounded-2xl">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <span className="material-icons mr-2">people</span>
                {user?.role === 'sonai' ? 'Your Meeting Attendees' : 'Member Attendance Overview'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredMeetings.length > 0 ? `Based on ${filteredMeetings.length} meeting${filteredMeetings.length > 1 ? 's' : ''}` : 'No meetings in selected period'}
              </p>
            </div>
            
            {memberStats.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {memberStats.map((member, index) => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            member.attendanceRate >= 80 ? 'bg-green-500' :
                            member.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold ${
                            index < 3 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.company}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          member.attendanceRate >= 80 ? 'text-green-600' :
                          member.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {member.attendanceRate}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.presentCount} of {member.totalMeetings}
                        </div>
                        
                        {/* Simplified progress bar */}
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              member.attendanceRate >= 80 ? 'bg-green-500' :
                              member.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${member.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <span className="material-icons text-4xl mb-2 opacity-50">people_outline</span>
                <p>No member data available for selected filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
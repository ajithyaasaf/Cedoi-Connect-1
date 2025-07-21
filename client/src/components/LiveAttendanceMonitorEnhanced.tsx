import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { safeName, safeCompany, safeText, safeAgenda } from '@/lib/render-safety';
import type { Meeting, User, AttendanceRecord } from '@shared/schema';
import cedoiLogoUrl from '@assets/Logo_1752669479851.png';

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
      <div className="min-h-screen bg-gradient-to-br from-[#0c5b84]/10 to-[#0a5472]/20 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#0c5b84]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="material-icons text-[#0c5b84] text-2xl">hourglass_empty</span>
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
      <div className="min-h-screen bg-gradient-to-br from-[#0c5b84]/10 to-[#0a5472]/20 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-[#0c5b84]/10 to-[#0a5472]/20 flex items-center justify-center">
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

  const handleCSVExport = () => {
    const csvData = [];
    
    const meetingDateFormatted = new Date(meeting.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const meetingTimeFormatted = new Date(meeting.date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Add meeting details header
    csvData.push(['CEDOI Madurai Forum - Attendance Report']);
    csvData.push(['Meeting Date:', meetingDateFormatted]);
    csvData.push(['Meeting Time:', meetingTimeFormatted]);
    csvData.push(['Venue:', meeting.venue]);
    if (meeting.theme) {
      csvData.push(['Theme:', meeting.theme]);
    }
    csvData.push(['Generated:', new Date().toLocaleString()]);
    csvData.push([]); // Empty row for spacing
    
    // Add statistics
    csvData.push(['Meeting Statistics']);
    csvData.push(['Total Members:', totalMembers.toString()]);
    csvData.push(['Present:', presentCount.toString()]);
    csvData.push(['Absent:', absentCount.toString()]);
    csvData.push(['Pending:', pendingCount.toString()]);
    csvData.push(['Attendance Rate:', `${attendancePercentage}%`]);
    csvData.push([]); // Empty row for spacing
    
    // Add attendance data header
    csvData.push(['Member Name', 'Company', 'Role', 'Attendance Status']);
    
    // Add member data
    members.forEach(member => {
      const status = attendanceMap.get(member.id);
      csvData.push([
        member.name,
        member.company,
        member.role,
        status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Pending'
      ]);
    });
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const meetingDate = new Date(meeting.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    link.setAttribute('download', `CEDOI-attendance-${meetingDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = async () => {
    // Convert image to base64 for embedding in print document
    const convertImageToBase64 = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = () => reject('Failed to load image');
        img.src = url;
      });
    };

    try {
      // Get base64 version of logo
      const logoBase64 = await convertImageToBase64(cedoiLogoUrl);
      
      const printWindow = window.open('', '', 'height=600,width=800');
      const meetingDate = new Date(meeting.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const meetingTime = new Date(meeting.date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Attendance Report - CEDOI Madurai Forum</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #04004B; padding-bottom: 15px; }
              .logo { max-width: 300px; height: auto; margin-bottom: 20px; }
              .subtitle { color: #666; margin: 5px 0; font-size: 16px; }
              .meeting-details { margin: 15px 0; }
              .stats { display: flex; justify-content: space-around; margin: 20px 0; }
              .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              .stat-number { font-size: 24px; font-weight: bold; color: #04004B; }
              .stat-label { font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #04004B; color: white; font-weight: bold; }
              .present { background-color: #d4edda; color: #155724; }
              .absent { background-color: #f8d7da; color: #721c24; }
              .pending { background-color: #fff3cd; color: #856404; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${logoBase64}" alt="CEDOI Logo" class="logo" />
              <h2 class="subtitle">Attendance Report</h2>
              <div class="meeting-details">
                <p class="subtitle"><strong>Date:</strong> ${meetingDate}</p>
                <p class="subtitle"><strong>Time:</strong> ${meetingTime}</p>
                <p class="subtitle"><strong>Venue:</strong> ${meeting.venue}</p>
                ${meeting.theme ? `<p class="subtitle"><strong>Theme:</strong> ${meeting.theme}</p>` : ''}
                <p class="subtitle"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-number">${totalMembers}</div>
              <div class="stat-label">Total Members</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${presentCount}</div>
              <div class="stat-label">Present</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${absentCount}</div>
              <div class="stat-label">Absent</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${pendingCount}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${attendancePercentage}%</div>
              <div class="stat-label">Attendance Rate</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(member => {
                const status = attendanceMap.get(member.id);
                const statusText = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Pending';
                const statusClass = status === 'present' ? 'present' : status === 'absent' ? 'absent' : 'pending';
                
                return `
                  <tr>
                    <td>${member.name}</td>
                    <td>${member.company}</td>
                    <td>${member.role}</td>
                    <td class="${statusClass}">${statusText}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated automatically by the CEDOI Madurai Forum Meeting Management System</p>
          </div>
        </body>
      </html>
    `;
    
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      console.error('Failed to load logo for print:', error);
      // Fallback: create a simple text-based print without logo
      const printWindow = window.open('', '', 'height=600,width=800');
      const meetingDate = new Date(meeting.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const meetingTime = new Date(meeting.date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const fallbackContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Attendance Report - CEDOI Madurai Forum</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #04004B; padding-bottom: 15px; }
              .title { color: #04004B; margin: 0; font-size: 24px; font-weight: bold; }
              .subtitle { color: #666; margin: 5px 0; font-size: 16px; }
              .meeting-details { margin: 15px 0; }
              .stats { display: flex; justify-content: space-around; margin: 20px 0; }
              .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              .stat-number { font-size: 24px; font-weight: bold; color: #04004B; }
              .stat-label { font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #04004B; color: white; font-weight: bold; }
              .present { background-color: #d4edda; color: #155724; }
              .absent { background-color: #f8d7da; color: #721c24; }
              .pending { background-color: #fff3cd; color: #856404; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">CEDOI Madurai Forum</h1>
              <h2 class="subtitle">Building Outstanding Entrepreneurs</h2>
              <h3 class="subtitle">Attendance Report</h3>
              <div class="meeting-details">
                <p class="subtitle"><strong>Date:</strong> ${meetingDate}</p>
                <p class="subtitle"><strong>Time:</strong> ${meetingTime}</p>
                <p class="subtitle"><strong>Venue:</strong> ${meeting.venue}</p>
                ${meeting.theme ? `<p class="subtitle"><strong>Theme:</strong> ${meeting.theme}</p>` : ''}
                <p class="subtitle"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-number">${totalMembers}</div>
                <div class="stat-label">Total Members</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${presentCount}</div>
                <div class="stat-label">Present</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${absentCount}</div>
                <div class="stat-label">Absent</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${pendingCount}</div>
                <div class="stat-label">Pending</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${attendancePercentage}%</div>
                <div class="stat-label">Attendance Rate</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${members.map(member => {
                  const status = attendanceMap.get(member.id);
                  const statusText = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Pending';
                  const statusClass = status === 'present' ? 'present' : status === 'absent' ? 'absent' : 'pending';
                  
                  return `
                    <tr>
                      <td>${member.name}</td>
                      <td>${member.company}</td>
                      <td>${member.role}</td>
                      <td class="${statusClass}">${statusText}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>This report was generated automatically by the CEDOI Madurai Forum Meeting Management System</p>
            </div>
          </body>
        </html>
      `;
      
      if (printWindow) {
        printWindow.document.write(fallbackContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Enhanced Header */}
      <div className="bg-white shadow-lg sticky top-0 z-20 border-b border-gray-200">
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span className="material-icons text-gray-700 text-lg sm:text-xl">arrow_back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Live Attendance Monitor
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {new Date(meeting.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })} • {meeting.venue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Stats Dashboard */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Main Stats Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm font-medium">Present</p>
                  <p className="text-2xl sm:text-3xl font-bold">{presentCount}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-lg sm:text-2xl">check_circle</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white h-1.5 sm:h-2 rounded-full transition-all duration-500"
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
                <p className="text-green-100 text-xs mt-1 hidden sm:block">{attendancePercentage}% rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-xs sm:text-sm font-medium">Absent</p>
                  <p className="text-2xl sm:text-3xl font-bold">{absentCount}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-lg sm:text-2xl">cancel</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white h-1.5 sm:h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalMembers > 0 ? (absentCount / totalMembers) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-red-100 text-xs mt-1 hidden sm:block">
                  {totalMembers > 0 ? Math.round((absentCount / totalMembers) * 100) : 0}% rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold">{pendingCount}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-lg sm:text-2xl">schedule</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white h-1.5 sm:h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalMembers > 0 ? (pendingCount / totalMembers) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-orange-100 text-xs mt-1 hidden sm:block">Awaiting</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total</p>
                  <p className="text-2xl sm:text-3xl font-bold">{totalMembers}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-lg sm:text-2xl">people</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white bg-opacity-20 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-white h-1.5 sm:h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <p className="text-blue-100 text-xs mt-1 hidden sm:block">{completionPercentage}% done</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-First Filter Section */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base sm:text-lg">{getViewTitle()}</CardTitle>
              
              {/* Mobile Filter Buttons - Horizontal Scroll */}
              <div className="flex space-x-1 overflow-x-auto pb-1 sm:pb-0">
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
                    className={`text-xs whitespace-nowrap flex-shrink-0 ${selectedView === key ? '' : color || ''}`}
                  >
                    <span className="material-icons text-sm mr-1">{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.slice(0,3)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-4">
            {/* Mobile-First Members List */}
            <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
              {getFilteredMembers().length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <span className="material-icons text-3xl sm:text-4xl mb-2 opacity-50">people_outline</span>
                  <p className="text-sm sm:text-base">No members in this category</p>
                </div>
              ) : (
                getFilteredMembers().map((member) => {
                  const status = attendanceMap.get(member.id);
                  const statusColor = status === 'present' ? 'text-green-600 bg-green-50' : 
                                    status === 'absent' ? 'text-red-600 bg-red-50' : 
                                    'text-orange-600 bg-orange-50';
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{member.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{member.company}</p>
                        </div>
                      </div>
                      <Badge 
                        className={`${statusColor} border-0 font-medium text-xs flex-shrink-0 ml-2`}
                      >
                        <span className="material-icons text-sm mr-1">
                          {status === 'present' ? 'check_circle' : 
                           status === 'absent' ? 'cancel' : 'schedule'}
                        </span>
                        <span className="hidden sm:inline">
                          {status === 'present' ? 'Present' : 
                           status === 'absent' ? 'Absent' : 'Pending'}
                        </span>
                        <span className="sm:hidden">
                          {status === 'present' ? 'P' : 
                           status === 'absent' ? 'A' : '?'}
                        </span>
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile-First Export Actions */}
        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">Export Current Status</h3>
                <p className="text-xs sm:text-sm text-gray-600">Download attendance report for this meeting</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCSVExport}
                  className="hover:bg-green-50 hover:border-green-200 flex-1 sm:flex-none"
                >
                  <span className="material-icons text-sm mr-1">file_download</span>
                  <span className="hidden sm:inline">CSV Export</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrintReport}
                  className="hover:bg-blue-50 hover:border-blue-200 flex-1 sm:flex-none"
                >
                  <span className="material-icons text-sm mr-1">print</span>
                  <span className="hidden sm:inline">Print Report</span>
                  <span className="sm:hidden">Print</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
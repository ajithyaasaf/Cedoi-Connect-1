import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import QRScanner from './QRScanner';
import type { User, AttendanceRecord } from '@shared/schema';

interface AttendanceScreenProps {
  meetingId: string;
  onBack: () => void;
}

export default function AttendanceScreenMobile({ meetingId, onBack }: AttendanceScreenProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent'>>({});
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  const { data: attendanceRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', meetingId],
    queryFn: () => api.attendance.getForMeeting(meetingId),
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'present' | 'absent' }) => {
      return api.attendance.updateStatus(meetingId, userId, status);
    },
    onSuccess: (_, { userId, status }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', meetingId] });
      const user = users.find(u => u.id === userId);
      toast({
        title: `${user?.name} marked ${status}`,
        description: `Attendance updated successfully`,
      });
    },
    onError: (_, { userId }) => {
      const user = users.find(u => u.id === userId);
      toast({
        title: "Failed to update attendance",
        description: `Please try again for ${user?.name}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const statusMap: Record<string, 'present' | 'absent'> = {};
    attendanceRecords.forEach(record => {
      statusMap[record.userId] = record.status as 'present' | 'absent';
    });
    setAttendanceStatus(statusMap);
  }, [attendanceRecords]);

  const handleStatusChange = (userId: string, status: 'present' | 'absent') => {
    setAttendanceStatus(prev => ({ ...prev, [userId]: status }));
    updateAttendanceMutation.mutate({ userId, status });
  };

  const handleQRScan = (qrData: string) => {
    const user = users.find(u => u.qrCode === qrData);
    if (user) {
      handleStatusChange(user.id, 'present');
      toast({
        title: "QR scanned successfully",
        description: `${user.name} marked present`,
      });
    } else {
      toast({
        title: "Invalid QR code",
        description: "Please try scanning again",
        variant: "destructive",
      });
    }
    setShowQRScanner(false);
  };

  const members = users.filter(user => user.role === 'member' || user.role === 'sonai');
  const presentCount = Object.values(attendanceStatus).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceStatus).filter(status => status === 'absent').length;
  const pendingCount = members.length - presentCount - absentCount;
  const progressPercentage = members.length > 0 ? ((presentCount + absentCount) / members.length) * 100 : 0;

  // Filter members based on search and tab
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const memberStatus = attendanceStatus[member.id];
    let matchesTab = true;
    
    if (selectedTab === 'present') matchesTab = memberStatus === 'present';
    else if (selectedTab === 'absent') matchesTab = memberStatus === 'absent';
    else if (selectedTab === 'pending') matchesTab = !memberStatus;
    
    return matchesSearch && matchesTab;
  });

  const handleMarkAllPresent = () => {
    const unmarkedMembers = members.filter(member => !attendanceStatus[member.id]);
    unmarkedMembers.forEach(member => {
      handleStatusChange(member.id, 'present');
    });
    if (unmarkedMembers.length > 0) {
      toast({
        title: "Bulk update complete",
        description: `${unmarkedMembers.length} members marked present`,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 safe-area-inset-bottom">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 rounded-full hover:bg-gray-100 touch-manipulation"
            >
              <span className="material-icons">arrow_back</span>
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Mark Attendance</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            onClick={() => setShowQRScanner(true)}
            className="h-10 w-10 bg-[#EB8A2F] hover:bg-[#EB8A2F]/90 text-white rounded-full touch-manipulation shadow-lg"
          >
            <span className="material-icons">qr_code_scanner</span>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {presentCount + absentCount} of {members.length} marked
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#04004B] to-[#EB8A2F] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Completion Status */}
          {presentCount + absentCount === members.length && members.length > 0 && (
            <div className="mt-2 flex items-center space-x-2 text-green-600">
              <span className="material-icons text-sm">check_circle</span>
              <span className="text-sm font-medium">All members marked!</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-white border-b">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <div className="text-xs text-gray-500">Present</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <div className="text-xs text-gray-500">Absent</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 border-2 border-gray-200 focus:border-[#EB8A2F] rounded-full"
          />
          <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            search
          </span>
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
            >
              <span className="material-icons text-sm">close</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex space-x-1 px-4 py-2">
          {[
            { key: 'all', label: 'All', count: members.length },
            { key: 'present', label: 'Present', count: presentCount },
            { key: 'absent', label: 'Absent', count: absentCount },
            { key: 'pending', label: 'Pending', count: pendingCount },
          ].map(tab => (
            <Button
              key={tab.key}
              variant={selectedTab === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab.key as any)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium ${
                selectedTab === tab.key
                  ? 'bg-[#04004B] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {pendingCount > 0 && (
        <div className="bg-white p-4 border-b">
          <div className="flex space-x-2">
            <Button
              onClick={handleMarkAllPresent}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full py-3 font-medium touch-manipulation shadow-lg"
              disabled={updateAttendanceMutation.isPending}
            >
              <span className="material-icons mr-2 text-sm">how_to_reg</span>
              Mark All Present
            </Button>
            <Button
              onClick={() => setShowQRScanner(true)}
              className="flex-1 bg-gradient-to-r from-[#EB8A2F] to-orange-500 hover:from-[#EB8A2F]/90 hover:to-orange-600 text-white rounded-full py-3 font-medium touch-manipulation shadow-lg"
            >
              <span className="material-icons mr-2 text-sm">qr_code_scanner</span>
              QR Scan
            </Button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-icons text-gray-400 text-2xl">search_off</span>
            </div>
            <p className="text-gray-500 text-sm">No members found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredMembers.map(member => {
              const status = attendanceStatus[member.id];
              return (
                <Card key={member.id} className="border-l-4 border-l-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="h-10 w-10 bg-[#04004B] text-white">
                          <AvatarFallback className="bg-[#04004B] text-white text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{member.company}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {status ? (
                          <Badge
                            variant={status === 'present' ? 'default' : 'destructive'}
                            className={`text-xs px-3 py-1 ${
                              status === 'present'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {status === 'present' ? 'Present' : 'Absent'}
                          </Badge>
                        ) : (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(member.id, 'present')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-xs font-medium touch-manipulation shadow-sm"
                              disabled={updateAttendanceMutation.isPending}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(member.id, 'absent')}
                              className="border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-full text-xs font-medium touch-manipulation shadow-sm"
                              disabled={updateAttendanceMutation.isPending}
                            >
                              Absent
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
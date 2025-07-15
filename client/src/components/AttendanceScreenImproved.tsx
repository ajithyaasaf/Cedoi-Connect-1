import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import QRScanner from './QRScanner';
import type { User, AttendanceRecord } from '@shared/schema';

interface AttendanceScreenProps {
  meetingId: string;
  onBack: () => void;
}

export default function AttendanceScreenImproved({ meetingId, onBack }: AttendanceScreenProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent'>>({});
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
        description: "Attendance updated",
      });
    },
    onError: (_, { userId }) => {
      const user = users.find(u => u.id === userId);
      toast({
        title: "Update failed",
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
        title: "QR scanned",
        description: `${user.name} marked present`,
      });
    } else {
      toast({
        title: "Invalid QR code",
        description: "Please try again",
        variant: "destructive",
      });
    }
    setShowQRScanner(false);
  };

  const handleMarkAllPending = () => {
    const pendingMembers = members.filter(member => !attendanceStatus[member.id]);
    pendingMembers.forEach(member => {
      handleStatusChange(member.id, 'present');
    });
    if (pendingMembers.length > 0) {
      toast({
        title: "Bulk update complete",
        description: `${pendingMembers.length} members marked present`,
      });
    }
  };

  const handleSubmitAttendance = async () => {
    setIsSaving(true);
    try {
      // Save attendance for all members who have a status
      const attendancePromises = Object.entries(attendanceStatus).map(([userId, status]) => {
        return api.attendance.updateStatus(meetingId, userId, status);
      });
      
      await Promise.all(attendancePromises);
      
      toast({
        title: "Attendance saved successfully",
        description: `${Object.keys(attendanceStatus).length} members' attendance recorded`,
      });
      
      // Go back to dashboard after successful save
      setTimeout(() => {
        onBack();
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate stats
  const members = users.filter(user => user.role === 'member' || user.role === 'sonai');
  const presentCount = Object.values(attendanceStatus).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceStatus).filter(status => status === 'absent').length;
  const pendingCount = members.length - presentCount - absentCount;
  const progressPercentage = members.length > 0 ? ((presentCount + absentCount) / members.length) * 100 : 0;
  const isComplete = pendingCount === 0 && members.length > 0;

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const memberStatus = attendanceStatus[member.id];
    let matchesTab = true;
    
    if (activeTab === 'present') matchesTab = memberStatus === 'present';
    else if (activeTab === 'absent') matchesTab = memberStatus === 'absent';
    else if (activeTab === 'pending') matchesTab = !memberStatus;
    
    return matchesSearch && matchesTab;
  });

  // Tab counts for display
  const tabCounts = {
    all: members.length,
    present: presentCount,
    absent: absentCount,
    pending: pendingCount
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Compact Header with integrated controls */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 rounded-full hover:bg-gray-100 touch-target"
            >
              <span className="material-icons text-lg">arrow_back</span>
            </Button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Mark Attendance</h1>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>{presentCount + absentCount}/{members.length} marked</span>
                <span>{Math.round(progressPercentage)}%</span>
                {isComplete && <span className="text-green-600">✓ Complete</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {pendingCount > 0 && (
              <Button
                onClick={handleMarkAllPending}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-full"
                disabled={updateAttendanceMutation.isPending}
              >
                Mark All ({pendingCount})
              </Button>
            )}
            <Button
              size="icon"
              onClick={() => setShowQRScanner(true)}
              className="h-8 w-8 bg-[#EB8A2F] hover:bg-[#EB8A2F]/90 text-white rounded-full touch-target"
            >
              <span className="material-icons text-lg">qr_code_scanner</span>
            </Button>
          </div>
        </div>

        {/* Compact search and filter row */}
        <div className="px-4 pb-2">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 border-gray-200 focus:border-[#EB8A2F] rounded-full text-sm"
              />
              <span className="material-icons absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                search
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full"
                >
                  <span className="material-icons text-xs">close</span>
                </Button>
              )}
            </div>
            
            {/* Compact tab buttons */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', count: members.length },
                { key: 'present', label: 'Present', count: presentCount },
                { key: 'absent', label: 'Absent', count: absentCount },
                { key: 'pending', label: 'Pending', count: pendingCount },
              ].map(tab => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-[#04004B] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete 
                ? 'bg-green-500' 
                : 'bg-gradient-to-r from-[#04004B] to-[#EB8A2F]'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Maximized Members List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <span className="material-icons text-gray-400 text-lg">
                {searchQuery ? 'search_off' : 'people_outline'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No members found' : 'No members in this category'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredMembers.map(member => {
              const status = attendanceStatus[member.id];
              return (
                <Card key={member.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 bg-[#04004B] text-white flex-shrink-0">
                          <AvatarFallback className="bg-[#04004B] text-white text-xs font-medium">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate text-sm">{member.name}</h3>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500 truncate">{member.company}</p>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                        {status ? (
                          <Badge
                            variant={status === 'present' ? 'default' : 'destructive'}
                            className={`text-xs px-2 py-1 status-badge-clickable cursor-pointer ${
                              status === 'present'
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                            }`}
                            onClick={() => handleStatusChange(member.id, status === 'present' ? 'absent' : 'present')}
                          >
                            {status === 'present' ? 'Present' : 'Absent'}
                          </Badge>
                        ) : (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(member.id, 'present')}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-full text-xs h-6 status-button touch-target"
                              disabled={updateAttendanceMutation.isPending}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(member.id, 'absent')}
                              className="border-red-200 text-red-600 hover:bg-red-50 px-2 py-1 rounded-full text-xs h-6 status-button touch-target"
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

      {/* Compact Submit Button - Show when there's attendance data */}
      {Object.keys(attendanceStatus).length > 0 && (
        <div className="bg-white border-t px-4 py-2 safe-area-pb">
          <Button
            onClick={handleSubmitAttendance}
            disabled={isSaving || Object.keys(attendanceStatus).length === 0}
            className={`w-full py-2 font-medium text-sm rounded-full transition-all duration-200 ${
              isComplete 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-[#04004B] hover:bg-[#04004B]/90 text-white'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : isComplete ? (
              <div className="flex items-center justify-center space-x-2">
                <span className="material-icons text-sm">check_circle</span>
                <span>Submit ({members.length} members)</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span className="material-icons text-sm">save</span>
                <span>Save Progress ({Object.keys(attendanceStatus).length}/{members.length})</span>
              </div>
            )}
          </Button>
        </div>
      )}

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
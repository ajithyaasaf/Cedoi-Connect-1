import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import QRScanner from './QRScanner';
import type { User, AttendanceRecord } from '@shared/schema';

interface AttendanceScreenProps {
  meetingId: string;
  onBack: () => void;
}

export default function AttendanceScreen({ meetingId, onBack }: AttendanceScreenProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent'>>({});
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
  const [attendanceSaved, setAttendanceSaved] = useState(false);
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
        title: "Attendance Updated",
        description: `${user?.name} marked as ${status}`,
      });
    },
    onError: (_, { userId }) => {
      const user = users.find(u => u.id === userId);
      toast({
        title: "Update Failed",
        description: `Failed to update ${user?.name}'s attendance. Please try again.`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Initialize attendance status from existing records
    const statusMap: Record<string, 'present' | 'absent'> = {};
    attendanceRecords.forEach(record => {
      statusMap[record.userId] = record.status as 'present' | 'absent';
    });
    setAttendanceStatus(statusMap);
  }, [attendanceRecords]);

  const handleStatusChange = async (userId: string, status: 'present' | 'absent') => {
    setAttendanceStatus(prev => ({ ...prev, [userId]: status }));
    updateAttendanceMutation.mutate({ userId, status });
  };

  const handleQRScan = (qrData: string) => {
    // Find user by QR code
    const user = users.find(u => u.qrCode === qrData);
    if (user) {
      handleStatusChange(user.id, 'present');
      toast({
        title: "QR Code Scanned",
        description: `${user.name} marked as present`,
      });
    } else {
      toast({
        title: "Invalid QR Code",
        description: "QR code not recognized. Please try again.",
        variant: "destructive",
      });
    }
    setShowQRScanner(false);
  };

  const members = users.filter(user => user.role === 'member' || user.role === 'sonai');
  const presentCount = Object.values(attendanceStatus).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceStatus).filter(status => status === 'absent').length;
  const markedCount = presentCount + absentCount;
  const unmarkedCount = members.length - markedCount;
  const progressPercentage = members.length > 0 ? (markedCount / members.length) * 100 : 0;
  const isAttendanceComplete = unmarkedCount === 0 && members.length > 0;

  // Filter and search members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const memberStatus = attendanceStatus[member.id];
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'present' && memberStatus === 'present') ||
                         (filterStatus === 'absent' && memberStatus === 'absent') ||
                         (filterStatus === 'unmarked' && !memberStatus);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Page Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
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
              <h1 className="text-xl font-semibold text-gray-900">Mark Attendance</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="material-icons text-sm">today</span>
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQRScanner(true)}
              className="flex items-center space-x-2 px-3 py-2 text-accent border-accent hover:bg-accent hover:text-white transition-colors"
            >
              <span className="material-icons text-sm">qr_code_scanner</span>
              <span className="hidden sm:inline">QR Scan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Attendance Progress */}
      <div className="bg-white p-4 shadow-sm border-l-4 border-l-accent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-accent">analytics</span>
            <span className="text-sm font-semibold text-foreground">Attendance Progress</span>
          </div>
          <Badge 
            variant={isAttendanceComplete ? "default" : "secondary"}
            className={isAttendanceComplete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
          >
            {markedCount}/{members.length} marked
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isAttendanceComplete ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-accent to-orange-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{presentCount}</div>
            <div className="text-xs text-gray-500">Present</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{absentCount}</div>
            <div className="text-xs text-gray-500">Absent</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-600">{unmarkedCount}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </div>
        
        {unmarkedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="material-icons text-amber-600">pending</span>
              <span className="text-sm text-amber-800">
                {unmarkedCount} member{unmarkedCount !== 1 ? 's' : ''} awaiting status
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
        )}
        
        {isAttendanceComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
            <span className="material-icons text-green-600">check_circle</span>
            <span className="text-sm text-green-800 font-medium">
              All members marked! Ready to save attendance.
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Search and Filter */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="space-y-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-accent transition-colors"
            />
            <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              search
            </span>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <span className="material-icons text-sm">close</span>
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="flex items-center space-x-2 px-3 py-2"
            >
              <span className="material-icons text-sm">group</span>
              <span>All ({members.length})</span>
            </Button>
            <Button
              variant={filterStatus === 'present' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('present')}
              className="flex items-center space-x-2 px-3 py-2 text-green-600 border-green-200 hover:bg-green-50"
            >
              <span className="material-icons text-sm">check_circle</span>
              <span>Present ({presentCount})</span>
            </Button>
            <Button
              variant={filterStatus === 'absent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('absent')}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <span className="material-icons text-sm">cancel</span>
              <span>Absent ({absentCount})</span>
            </Button>
            <Button
              variant={filterStatus === 'unmarked' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('unmarked')}
              className="flex items-center space-x-2 px-3 py-2 text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <span className="material-icons text-sm">pending</span>
              <span>Pending ({unmarkedCount})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="space-y-3">
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowQRScanner(true)}
              className="flex-1 bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-600 text-white py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide shadow-lg transition-all duration-200"
            >
              <span className="material-icons mr-2">qr_code_scanner</span>
              SCAN QR
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide border-2 border-green-200 text-green-700 hover:bg-green-50 transition-all duration-200"
              onClick={() => {
                const unmarkedMembers = members.filter(member => !attendanceStatus[member.id]);
                unmarkedMembers.forEach(member => {
                  handleStatusChange(member.id, 'present');
                });
                if (unmarkedMembers.length > 0) {
                  toast({
                    title: "Bulk Action Complete",
                    description: `${unmarkedMembers.length} members marked as present`,
                  });
                }
              }}
            >
              <span className="material-icons mr-2">how_to_reg</span>
              MARK ALL PRESENT
            </Button>
          </div>
          
          {unmarkedCount > 0 && absentCount > 0 && (
            <Button
              variant="outline"
              className="w-full py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200"
              onClick={() => {
                const unmarkedMembers = members.filter(member => !attendanceStatus[member.id]);
                unmarkedMembers.forEach(member => {
                  handleStatusChange(member.id, 'present');
                });
                toast({
                  title: "Remaining Members Marked Present",
                  description: `${unmarkedMembers.length} unmarked members automatically marked as present`,
                });
              }}
            >
              <span className="material-icons mr-2">playlist_add_check</span>
              MARK REMAINING {unmarkedCount} AS PRESENT
            </Button>
          )}
        </div>
      </div>

      {/* Final Results - Show after attendance is saved */}
      {attendanceSaved && (
        <div className="bg-green-50 border-t-4 border-green-500 p-4 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-green-800">Attendance Completed</h3>
              <p className="text-sm text-green-600">Meeting attendance has been successfully recorded</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">{members.length}</div>
              <div className="text-xs text-green-600">Total Members</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="material-icons text-green-600">check_circle</span>
                <div className="text-right">
                  <div className="text-xl font-semibold text-green-700">{presentCount}</div>
                  <div className="text-xs text-green-600">Present</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="material-icons text-red-500">cancel</span>
                <div className="text-right">
                  <div className="text-xl font-semibold text-red-600">{absentCount}</div>
                  <div className="text-xs text-red-500">Absent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <main className="p-4 pb-20">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-6 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-gray-400 text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Members Found</h3>
            <p className="text-gray-500 mb-6">No members match your current search or filter settings.</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
              >
                <span className="material-icons mr-2">refresh</span>
                Clear All Filters
              </Button>
              <p className="text-sm text-gray-400">
                {searchQuery && `Searched: "${searchQuery}"`}
                {searchQuery && filterStatus !== 'all' && ' • '}
                {filterStatus !== 'all' && `Filter: ${filterStatus}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const status = attendanceStatus[member.id];
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            
            return (
              <Card
                key={member.id}
                className={`attendance-card shadow-lg transition-all duration-300 hover:shadow-xl ${
                  isPresent ? 'border-l-4 border-l-green-500 bg-green-50/50' : 
                  isAbsent ? 'border-l-4 border-l-red-500 bg-red-50/50' : 
                  'border-l-4 border-l-amber-500 bg-amber-50/50 hover:bg-amber-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                          isPresent ? 'bg-green-500 border-green-400' : 
                          isAbsent ? 'bg-red-500 border-red-400' : 
                          'bg-gray-200 border-gray-300'
                        }`}>
                          <span className={`material-icons text-lg ${
                            isPresent || isAbsent ? 'text-white' : 'text-gray-500'
                          }`}>
                            person
                          </span>
                        </div>
                        {status && (
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                            isPresent ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            <span className="material-icons text-white text-xs">
                              {isPresent ? 'check' : 'close'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="material-icons text-sm mr-1">business</span>
                          {member.company}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {member.role}
                          </Badge>
                          {status && (
                            <span className="text-xs text-gray-500">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {status ? (
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={`px-3 py-1 font-semibold uppercase tracking-wide ${
                              isPresent ? 'bg-green-100 text-green-800 border-green-300' : 
                              'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            {status}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(member.id, 'present')}
                            className="bg-green-500 hover:bg-green-600 text-white border-0 px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wide shadow-md transition-all duration-200 hover:shadow-lg"
                          >
                            <span className="material-icons text-sm mr-1">check</span>
                            PRESENT
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(member.id, 'absent')}
                            className="bg-red-500 hover:bg-red-600 text-white border-0 px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wide shadow-md transition-all duration-200 hover:shadow-lg"
                          >
                            <span className="material-icons text-sm mr-1">close</span>
                            ABSENT
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
      </main>

      {/* Enhanced Save Button */}
      <div className="fixed bottom-16 left-4 right-4 bg-white p-4 shadow-2xl rounded-xl border-t-4 border-t-accent">
        {!isAttendanceComplete ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 rounded-full p-2">
                    <span className="material-icons text-amber-600">pending_actions</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Attendance Incomplete
                    </p>
                    <p className="text-xs text-amber-600">
                      {unmarkedCount} member{unmarkedCount !== 1 ? 's' : ''} still need{unmarkedCount === 1 ? 's' : ''} to be marked
                    </p>
                  </div>
                </div>
                {absentCount > 0 && unmarkedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-2 border-green-500 text-green-700 hover:bg-green-50 text-xs px-3 py-2 font-semibold"
                    onClick={() => {
                      const unmarkedMembers = members.filter(member => !attendanceStatus[member.id]);
                      unmarkedMembers.forEach(member => {
                        handleStatusChange(member.id, 'present');
                      });
                      toast({
                        title: "Quick Complete",
                        description: `${unmarkedMembers.length} remaining members marked as present`,
                      });
                    }}
                  >
                    <span className="material-icons text-xs mr-1">done_all</span>
                    MARK REST
                  </Button>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-400">info</span>
                  <span className="text-sm text-gray-600">Progress: {Math.round(progressPercentage)}%</span>
                </div>
                <div className="text-sm text-gray-500">
                  {presentCount} present • {absentCount} absent
                </div>
              </div>
            </div>
            
            <Button
              disabled
              className="w-full bg-gray-200 text-gray-500 py-4 px-6 rounded-lg font-semibold text-sm uppercase tracking-wide cursor-not-allowed border-2 border-gray-300"
            >
              <span className="material-icons mr-2">block</span>
              CANNOT SAVE - {unmarkedCount} PENDING
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <span className="material-icons text-green-600">check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Ready to Save</p>
                  <p className="text-xs text-green-600">All {members.length} members have been marked</p>
                </div>
              </div>
            </div>
            
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg font-semibold text-sm uppercase tracking-wide shadow-lg transition-all duration-200 hover:shadow-xl"
              onClick={() => {
                setAttendanceSaved(true);
                toast({
                  title: "Attendance Saved Successfully",
                  description: `All ${members.length} members marked. ${presentCount} present, ${absentCount} absent.`,
                });
              }}
            >
              <span className="material-icons mr-2">save</span>
              SAVE COMPLETE ATTENDANCE
            </Button>
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

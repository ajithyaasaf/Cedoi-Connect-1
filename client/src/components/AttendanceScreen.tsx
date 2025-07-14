import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', meetingId] });
      toast({
        title: "Attendance Updated",
        description: "Attendance status has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 p-4">
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
              <h1 className="text-xl font-medium text-gray-900">Mark Attendance</h1>
              <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQRScanner(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <span className="material-icons">qr_code_scanner</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Progress */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Attendance Progress</span>
          <span className="text-sm text-gray-600">
            {markedCount}/{members.length} marked
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isAttendanceComplete ? 'bg-success' : 'bg-accent'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {unmarkedCount > 0 && (
          <div className="mt-2 text-xs text-amber-600 flex items-center">
            <span className="material-icons text-sm mr-1">warning</span>
            {unmarkedCount} member{unmarkedCount !== 1 ? 's' : ''} not yet marked
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowQRScanner(true)}
            className="flex-1 bg-accent hover:bg-accent/90 text-white py-3 px-4 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
          >
            <span className="material-icons mr-2">qr_code_scanner</span>
            SCAN QR
          </Button>
          <Button
            variant="outline"
            className="flex-1 py-3 px-4 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
            onClick={() => {
              members.forEach(member => {
                if (!attendanceStatus[member.id]) {
                  handleStatusChange(member.id, 'present');
                }
              });
            }}
          >
            <span className="material-icons mr-2">how_to_reg</span>
            MARK ALL PRESENT
          </Button>
        </div>
      </div>

      {/* Members List */}
      <main className="p-4 pb-20">
        <div className="space-y-3">
          {members.map((member) => {
            const status = attendanceStatus[member.id];
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            
            return (
              <Card
                key={member.id}
                className={`attendance-card shadow-material ${
                  isPresent ? 'border-2 border-success bg-green-50' : 
                  isAbsent ? 'border-2 border-destructive bg-red-50' : 
                  'border-2 border-amber-300 bg-amber-50'
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isPresent ? 'bg-success' : 
                      isAbsent ? 'bg-destructive' : 
                      'bg-gray-200'
                    }`}>
                      <span className={`material-icons ${
                        isPresent || isAbsent ? 'text-white' : 'text-gray-500'
                      }`}>
                        person
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.company}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status ? (
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isPresent ? 'text-white' : 'text-white'
                        }`}
                        style={{ 
                          backgroundColor: isPresent ? '#16a34a' : '#dc2626',
                          color: 'white'
                        }}>
                          {status.toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(member.id, 'absent')}
                          className="bg-red-500 hover:bg-red-600 text-white border-0 px-3 py-2 rounded-lg font-medium text-xs uppercase tracking-wide shadow-md"
                          style={{ backgroundColor: '#dc2626', color: 'white' }}
                        >
                          <span className="material-icons text-sm mr-1">close</span>
                          ABSENT
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(member.id, 'present')}
                          className="bg-green-500 hover:bg-green-600 text-white border-0 px-3 py-2 rounded-lg font-medium text-xs uppercase tracking-wide shadow-md"
                          style={{ backgroundColor: '#16a34a', color: 'white' }}
                        >
                          <span className="material-icons text-sm mr-1">check</span>
                          PRESENT
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Save Button */}
      <div className="fixed bottom-16 left-4 right-4 bg-white p-4 shadow-material-lg rounded-xl">
        {!isAttendanceComplete ? (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center">
                <span className="material-icons text-amber-600 mr-2">warning</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Attendance Incomplete
                  </p>
                  <p className="text-xs text-amber-600">
                    Please mark all {unmarkedCount} remaining member{unmarkedCount !== 1 ? 's' : ''} as present or absent
                  </p>
                </div>
              </div>
            </div>
            <Button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-3 px-6 rounded-lg font-medium text-sm uppercase tracking-wide cursor-not-allowed"
            >
              <span className="material-icons mr-2">block</span>
              CANNOT SAVE - INCOMPLETE
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-success hover:bg-success/90 text-white py-3 px-6 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
            onClick={() => {
              toast({
                title: "Attendance Saved",
                description: `All ${members.length} members marked. ${presentCount} present, ${absentCount} absent.`,
              });
            }}
          >
            <span className="material-icons mr-2">save</span>
            SAVE COMPLETE ATTENDANCE
          </Button>
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

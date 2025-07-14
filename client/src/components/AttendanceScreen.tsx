import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User, AttendanceRecord } from '@shared/schema';

interface AttendanceScreenProps {
  meetingId: number;
  onBack: () => void;
}

export default function AttendanceScreen({ meetingId, onBack }: AttendanceScreenProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, 'present' | 'absent'>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: attendanceRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', meetingId],
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: 'present' | 'absent' }) => {
      return apiRequest('PUT', `/api/attendance/${meetingId}/${userId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance', meetingId] });
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
    const statusMap: Record<number, 'present' | 'absent'> = {};
    attendanceRecords.forEach(record => {
      statusMap[record.userId] = record.status as 'present' | 'absent';
    });
    setAttendanceStatus(statusMap);
  }, [attendanceRecords]);

  const handleStatusChange = async (userId: number, status: 'present' | 'absent') => {
    setAttendanceStatus(prev => ({ ...prev, [userId]: status }));
    updateAttendanceMutation.mutate({ userId, status });
  };

  const members = users.filter(user => user.role === 'member' || user.role === 'sonai');
  const presentCount = Object.values(attendanceStatus).filter(status => status === 'present').length;
  const progressPercentage = members.length > 0 ? (presentCount / members.length) * 100 : 0;

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
            {presentCount}/{members.length} marked
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex space-x-3">
          <Button className="flex-1 bg-accent hover:bg-accent/90 text-white py-3 px-4 rounded-lg font-medium text-sm uppercase tracking-wide ripple">
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
            <span className="material-icons mr-2">select_all</span>
            MARK ALL
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
                  isAbsent ? 'border-2 border-destructive bg-red-50' : ''
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
                      <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status ? (
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isPresent ? 'bg-success text-white' : 'bg-destructive text-white'
                        }`}>
                          {status.toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleStatusChange(member.id, 'absent')}
                          className="w-10 h-10 bg-destructive hover:bg-destructive/90 text-white rounded-full border-0 ripple"
                        >
                          <span className="material-icons text-sm">close</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleStatusChange(member.id, 'present')}
                          className="w-10 h-10 bg-success hover:bg-success/90 text-white rounded-full border-0 ripple"
                        >
                          <span className="material-icons text-sm">check</span>
                        </Button>
                      </>
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
        <Button
          className="w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
          onClick={() => {
            toast({
              title: "Attendance Saved",
              description: "All attendance records have been saved successfully.",
            });
          }}
        >
          SAVE ATTENDANCE
        </Button>
      </div>
    </div>
  );
}

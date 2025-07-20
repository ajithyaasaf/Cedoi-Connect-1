import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { Meeting, AttendanceRecord } from '@shared/schema';

interface Notification {
  id: string;
  type: 'meeting_reminder' | 'attendance_required' | 'meeting_created' | 'attendance_update';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  meetingId?: string;
  actionRequired?: boolean;
}

interface NotificationCenterProps {
  onMarkAttendance?: (meetingId: string) => void;
  onViewMeeting?: (meetingId: string) => void;
}

export default function NotificationCenter({ onMarkAttendance, onViewMeeting }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get meetings data
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.getAll(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Get today's meeting
  const { data: todaysMeeting } = useQuery<Meeting | null>({
    queryKey: ['meetings', 'today'],
    queryFn: () => api.meetings.getTodaysMeeting(),
    refetchInterval: 30000,
  });

  // Get attendance records for today's meeting
  const { data: attendanceRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', todaysMeeting?.id],
    queryFn: () => todaysMeeting ? api.attendance.getForMeeting(todaysMeeting.id) : Promise.resolve([]),
    enabled: !!todaysMeeting,
    refetchInterval: 30000,
  });

  // Generate notifications based on data
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();
      const oneHour = 60 * 60 * 1000;

      // Meeting reminders (1 hour before)
      meetings.forEach(meeting => {
        const meetingTime = new Date(meeting.date);
        const timeDiff = meetingTime.getTime() - now.getTime();
        
        if (timeDiff > 0 && timeDiff <= oneHour) {
          newNotifications.push({
            id: `reminder_${meeting.id}`,
            type: 'meeting_reminder',
            title: 'Upcoming Meeting',
            message: `Meeting at ${meeting.venue} starts in ${Math.round(timeDiff / (60 * 1000))} minutes`,
            timestamp: now,
            read: false,
            meetingId: meeting.id,
            actionRequired: true
          });
        }
      });

      // Today's meeting attendance required
      if (todaysMeeting && user?.role === 'sonai') {
        const userAttendance = attendanceRecords.find(record => record.userId === user.id);
        if (!userAttendance) {
          newNotifications.push({
            id: `attendance_${todaysMeeting.id}`,
            type: 'attendance_required',
            title: 'Attendance Required',
            message: `Please mark attendance for today's meeting at ${todaysMeeting.venue}`,
            timestamp: now,
            read: false,
            meetingId: todaysMeeting.id,
            actionRequired: true
          });
        }
      }

      // New meeting created notifications
      const recentMeetings = meetings.filter(meeting => {
        const created = new Date(meeting.date);
        const daysDiff = (now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
        return daysDiff <= 1 && new Date(meeting.date) > now;
      });

      recentMeetings.forEach(meeting => {
        newNotifications.push({
          id: `new_meeting_${meeting.id}`,
          type: 'meeting_created',
          title: 'New Meeting Scheduled',
          message: `Meeting scheduled for ${new Date(meeting.date).toLocaleDateString()} at ${meeting.venue}`,
          timestamp: new Date(meeting.date),
          read: false,
          meetingId: meeting.id
        });
      });

      // Live attendance updates for Chairman
      if (todaysMeeting && user?.role === 'chairman') {
        const attendanceCount = attendanceRecords.filter(record => record.status === 'present').length;
        const totalMembers = attendanceRecords.length;
        
        if (totalMembers > 0) {
          newNotifications.push({
            id: `live_update_${todaysMeeting.id}`,
            type: 'attendance_update',
            title: 'Live Attendance Update',
            message: `${attendanceCount}/${totalMembers} members present at today's meeting`,
            timestamp: now,
            read: false,
            meetingId: todaysMeeting.id
          });
        }
      }

      setNotifications(newNotifications);
    };

    generateNotifications();
  }, [meetings, todaysMeeting, attendanceRecords, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.actionRequired && notification.meetingId) {
      if (notification.type === 'attendance_required' && onMarkAttendance) {
        onMarkAttendance(notification.meetingId);
        setIsOpen(false);
      } else if (onViewMeeting) {
        onViewMeeting(notification.meetingId);
        setIsOpen(false);
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'meeting_reminder':
        return 'schedule';
      case 'attendance_required':
        return 'fact_check';
      case 'meeting_created':
        return 'event';
      case 'attendance_update':
        return 'analytics';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'meeting_reminder':
        return 'text-orange-600';
      case 'attendance_required':
        return 'text-red-600';
      case 'meeting_created':
        return 'text-blue-600';
      case 'attendance_update':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-2xl relative hover:bg-gray-100"
        >
          <span className="material-icons text-xl text-gray-600">notifications</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-0 shadow-lg rounded-2xl" align="end">
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-white text-xs hover:bg-white/20 h-6 px-2"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <span className="material-icons text-4xl text-gray-300 mb-2 block">notifications_none</span>
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <span className={`material-icons text-sm ${
                          !notification.read ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium truncate ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {notification.actionRequired && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
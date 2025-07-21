import React, { useState, useEffect } from 'react';
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

  // Get meetings data with proper error handling
  const { data: meetings = [], error: meetingsError, isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      try {
        return await api.meetings.getAll();
      } catch (error) {
        console.log('Meetings query error:', error);
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });

  // Get today's meeting with proper error handling
  const { data: todaysMeeting, error: todaysMeetingError, isLoading: todaysMeetingLoading } = useQuery({
    queryKey: ['meetings', 'today'],
    queryFn: async () => {
      try {
        return await api.meetings.getTodaysMeeting();
      } catch (error) {
        console.log('Today\'s meeting query error:', error);
        return null;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Get attendance records for today's meeting with proper error handling
  const { data: attendanceRecords = [], error: attendanceError, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', todaysMeeting?.id],
    queryFn: async () => {
      if (!todaysMeeting?.id) return [];
      try {
        return await api.attendance.getForMeeting(todaysMeeting.id);
      } catch (error) {
        console.log('Attendance query error:', error);
        return [];
      }
    },
    enabled: !!todaysMeeting?.id,
    refetchInterval: 30000,
    retry: 1,
  });

  // Generate real-time notifications with stable dependencies
  useEffect(() => {
    if (meetingsLoading || todaysMeetingLoading || attendanceLoading || !user) {
      return;
    }

    const generateRealTimeNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();
      const oneHour = 60 * 60 * 1000;
      const thirtyMinutes = 30 * 60 * 1000;

      // Meeting reminders for upcoming meetings
      if (meetings && Array.isArray(meetings)) {
        meetings.forEach(meeting => {
          const meetingDate = new Date(meeting.date);
          const timeDiff = meetingDate.getTime() - now.getTime();
          
          // Show reminder if meeting is within 1 hour but more than 5 minutes away
          if (timeDiff > 5 * 60 * 1000 && timeDiff <= oneHour) {
            const minutesUntil = Math.round(timeDiff / (60 * 1000));
            newNotifications.push({
              id: `reminder_${meeting.id}`,
              type: 'meeting_reminder',
              title: 'Upcoming Meeting',
              message: `Meeting at ${meeting.venue} starts in ${minutesUntil} minutes`,
              timestamp: now,
              read: false,
              meetingId: meeting.id,
              actionRequired: true
            });
          }

          // Show immediate alert if meeting starts in 5 minutes or less
          if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
            newNotifications.push({
              id: `urgent_${meeting.id}`,
              type: 'meeting_reminder',
              title: 'Meeting Starting Now!',
              message: `Meeting at ${meeting.venue} is starting now`,
              timestamp: now,
              read: false,
              meetingId: meeting.id,
              actionRequired: true
            });
          }
        });
      }

      // Today's meeting attendance notifications for Sonai
      if (todaysMeeting && user.role === 'sonai') {
        const userAttendanceRecord = attendanceRecords?.find(record => record.userId === user.id);
        if (!userAttendanceRecord) {
          newNotifications.push({
            id: `attendance_required_${todaysMeeting.id}`,
            type: 'attendance_required',
            title: 'Attendance Required',
            message: `Please mark your attendance for today's meeting at ${todaysMeeting.venue}`,
            timestamp: now,
            read: false,
            meetingId: todaysMeeting.id,
            actionRequired: true
          });
        } else if (userAttendanceRecord.status === 'absent') {
          newNotifications.push({
            id: `marked_absent_${todaysMeeting.id}`,
            type: 'attendance_update',
            title: 'Marked as Absent',
            message: `You are marked absent for today's meeting. Contact organizer if this is incorrect.`,
            timestamp: now,
            read: false,
            meetingId: todaysMeeting.id,
            actionRequired: false
          });
        }
      }

      // Live attendance updates for Chairman
      if (todaysMeeting && user.role === 'chairman' && attendanceRecords && attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
        const totalMembers = attendanceRecords.length;
        const attendancePercentage = Math.round((presentCount / totalMembers) * 100);

        newNotifications.push({
          id: `live_attendance_${todaysMeeting.id}`,
          type: 'attendance_update',
          title: 'Live Attendance Update',
          message: `${presentCount}/${totalMembers} members present (${attendancePercentage}%)`,
          timestamp: now,
          read: false,
          meetingId: todaysMeeting.id,
          actionRequired: false
        });

        // Alert if attendance is low
        if (attendancePercentage < 50 && totalMembers > 5) {
          newNotifications.push({
            id: `low_attendance_${todaysMeeting.id}`,
            type: 'attendance_update',
            title: 'Low Attendance Alert',
            message: `Only ${attendancePercentage}% attendance. Consider sending reminders.`,
            timestamp: now,
            read: false,
            meetingId: todaysMeeting.id,
            actionRequired: true
          });
        }
      }

      // New meetings created in last 24 hours
      if (meetings && Array.isArray(meetings)) {
        const recentMeetings = meetings.filter(meeting => {
          const meetingDate = new Date(meeting.date);
          const daysSinceCreated = (now.getTime() - new Date(meeting.createdAt || meeting.date).getTime()) / (24 * 60 * 60 * 1000);
          return daysSinceCreated <= 1 && meetingDate > now;
        });

        recentMeetings.forEach(meeting => {
          newNotifications.push({
            id: `new_meeting_${meeting.id}`,
            type: 'meeting_created',
            title: 'New Meeting Scheduled',
            message: `Meeting scheduled for ${new Date(meeting.date).toLocaleDateString()} at ${meeting.venue}`,
            timestamp: new Date(meeting.createdAt || meeting.date),
            read: false,
            meetingId: meeting.id,
            actionRequired: false
          });
        });
      }

      // Welcome notification for first-time users
      if (newNotifications.length === 0) {
        newNotifications.push({
          id: 'welcome',
          type: 'meeting_reminder',
          title: 'Welcome to CEDOI Forum',
          message: user.role === 'chairman' 
            ? 'You can create meetings and monitor live attendance'
            : user.role === 'sonai'
            ? 'You can mark attendance for meetings'
            : 'Stay updated with meeting schedules and notifications',
          timestamp: now,
          read: false,
          actionRequired: false
        });
      }

      return newNotifications;
    };

    const newNotifications = generateRealTimeNotifications();
    setNotifications(newNotifications);

  }, [meetings, todaysMeeting, attendanceRecords, user, meetingsLoading, todaysMeetingLoading, attendanceLoading]);

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

  // Show loading state if any queries are loading
  const isLoading = meetingsLoading || todaysMeetingLoading || attendanceLoading;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-2xl relative hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          disabled={isLoading}
        >
          <span className="material-icons text-xl">
            {isLoading ? 'hourglass_empty' : 'notifications'}
          </span>
          {!isLoading && unreadCount > 0 && (
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
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                <span className="material-icons text-4xl text-gray-300 mb-2 block animate-spin">hourglass_empty</span>
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : (meetingsError || todaysMeetingError || attendanceError) ? (
              <div className="p-6 text-center text-gray-500">
                <span className="material-icons text-4xl text-red-300 mb-2 block">error_outline</span>
                <p className="text-sm">Unable to load notifications</p>
                <button 
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['meetings'] });
                    queryClient.invalidateQueries({ queryKey: ['attendance'] });
                  }}
                  className="text-xs text-blue-600 mt-2 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
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
                        notification.type === 'meeting_reminder' && notification.title.includes('Starting Now') 
                          ? 'bg-red-100 animate-pulse' 
                          : notification.type === 'attendance_required'
                          ? 'bg-orange-100'
                          : notification.type === 'attendance_update' && notification.title.includes('Low Attendance')
                          ? 'bg-yellow-100'
                          : !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <span className={`material-icons text-sm ${
                          notification.type === 'meeting_reminder' && notification.title.includes('Starting Now')
                            ? 'text-red-600'
                            : notification.type === 'attendance_required'
                            ? 'text-orange-600'
                            : notification.type === 'attendance_update' && notification.title.includes('Low Attendance')
                            ? 'text-yellow-600'
                            : !notification.read ? 'text-blue-600' : 'text-gray-500'
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
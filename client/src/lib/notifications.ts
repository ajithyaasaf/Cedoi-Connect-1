// Notification system for meeting alerts and reminders

export interface NotificationData {
  title: string;
  message: string;
  type: 'meeting_created' | 'meeting_reminder' | 'attendance_required';
  meetingId?: string;
  recipients: string[]; // User IDs
}

class NotificationService {
  private notifications: NotificationData[] = [];

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Send browser notification
  async sendBrowserNotification(title: string, message: string, icon?: string) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }

    const notification = new Notification(title, {
      body: message,
      icon: icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'cedoi-meeting',
      requireInteraction: true
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // Send meeting creation notification
  async notifyMeetingCreated(meetingData: {
    date: Date;
    venue: string;
    agenda: string;
  }, recipients: string[]) {
    const title = 'New Meeting Scheduled';
    const message = `Meeting on ${meetingData.date.toLocaleDateString()} at ${meetingData.venue}`;
    
    // Send browser notification
    await this.sendBrowserNotification(title, message);

    // Store for in-app notifications
    this.notifications.push({
      title,
      message,
      type: 'meeting_created',
      recipients
    });

    // In a real app, this would send to a backend service
    console.log('Meeting notification sent:', { title, message, recipients });
  }

  // Send meeting reminder
  async sendMeetingReminder(meetingData: {
    date: Date;
    venue: string;
    agenda: string;
  }, recipients: string[]) {
    const title = 'Meeting Reminder';
    const message = `Meeting starting in 1 hour at ${meetingData.venue}`;
    
    await this.sendBrowserNotification(title, message);

    this.notifications.push({
      title,
      message,
      type: 'meeting_reminder',
      recipients
    });

    console.log('Meeting reminder sent:', { title, message, recipients });
  }

  // Schedule a reminder for 1 hour before meeting
  scheduleReminder(meetingDate: Date, meetingData: any, recipients: string[]) {
    const reminderTime = new Date(meetingDate.getTime() - 60 * 60 * 1000); // 1 hour before
    const now = new Date();

    if (reminderTime > now) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.sendMeetingReminder(meetingData, recipients);
      }, timeUntilReminder);

      console.log(`Reminder scheduled for ${reminderTime.toLocaleString()}`);
    }
  }

  // Get all notifications for a user
  getNotifications(userId: string): NotificationData[] {
    return this.notifications.filter(notification => 
      notification.recipients.includes(userId)
    );
  }

  // Clear notifications
  clearNotifications() {
    this.notifications = [];
  }
}

export const notificationService = new NotificationService();
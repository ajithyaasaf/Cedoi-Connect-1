import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bell, Moon, Sun, Smartphone, Globe, Shield, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

export default function Settings() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // Load settings from localStorage with defaults
  const [meetingReminders, setMeetingReminders] = useState(() => {
    return localStorage.getItem('meetingReminders') !== 'false';
  });
  const [attendanceAlerts, setAttendanceAlerts] = useState(() => {
    return localStorage.getItem('attendanceAlerts') !== 'false';
  });
  const [reportNotifications, setReportNotifications] = useState(() => {
    return localStorage.getItem('reportNotifications') === 'true';
  });
  const [autoRefresh, setAutoRefresh] = useState(() => {
    return localStorage.getItem('autoRefresh') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('soundEnabled') !== 'false';
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('meetingReminders', meetingReminders.toString());
  }, [meetingReminders]);

  useEffect(() => {
    localStorage.setItem('attendanceAlerts', attendanceAlerts.toString());
  }, [attendanceAlerts]);

  useEffect(() => {
    localStorage.setItem('reportNotifications', reportNotifications.toString());
  }, [reportNotifications]);

  useEffect(() => {
    localStorage.setItem('autoRefresh', autoRefresh.toString());
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Logout error",
        description: "You have been logged out anyway",
        variant: "destructive",
      });
    }
  };

  const clearCache = () => {
    // Clear localStorage except for settings
    const settingsKeys = ['meetingReminders', 'attendanceAlerts', 'reportNotifications', 'autoRefresh', 'soundEnabled'];
    const settings: Record<string, string> = {};
    
    // Preserve current settings
    settingsKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) settings[key] = value;
    });
    
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore settings
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    toast({
      title: "Cache cleared",
      description: "App data cleared while preserving your settings.",
    });
  };

  const handleNotificationTest = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('CEDOI Madurai Forum', {
          body: 'Test notification sent successfully!',
          icon: '/favicon.ico'
        });
        toast({
          title: "Test notification sent",
          description: "Check your device notifications.",
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('CEDOI Madurai Forum', {
              body: 'Notifications enabled successfully!',
              icon: '/favicon.ico'
            });
            toast({
              title: "Notifications enabled",
              description: "You'll now receive meeting alerts.",
            });
          }
        });
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in browser settings.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Not supported",
        description: "Notifications not supported on this device.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {theme === 'dark' ? <Moon className="h-5 w-5 mr-2" /> : <Sun className="h-5 w-5 mr-2" />}
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the app looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-gray-500">Use dark theme for better night viewing</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Meeting Reminders</Label>
                <p className="text-sm text-gray-500">Get notified before meetings start</p>
              </div>
              <Switch
                checked={meetingReminders}
                onCheckedChange={setMeetingReminders}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Attendance Alerts</Label>
                <p className="text-sm text-gray-500">Notifications when attendance marking is required</p>
              </div>
              <Switch
                checked={attendanceAlerts}
                onCheckedChange={setAttendanceAlerts}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Report Notifications</Label>
                <p className="text-sm text-gray-500">Get notified about new attendance reports</p>
              </div>
              <Switch
                checked={reportNotifications}
                onCheckedChange={setReportNotifications}
              />
            </div>
            <Separator />
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotificationTest}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Test Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              App Behavior
            </CardTitle>
            <CardDescription>
              Control how the app behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Refresh</Label>
                <p className="text-sm text-gray-500">Automatically refresh data every 30 seconds</p>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound Effects</Label>
                <p className="text-sm text-gray-500">Play sounds for notifications and actions</p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Manage your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={clearCache}
                className="w-full justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear App Cache
              </Button>
              <p className="text-xs text-gray-500">
                Clears temporary data while keeping your settings
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <p className="text-xs text-gray-500">
                Sign out of your account securely
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset all settings to defaults
                  setMeetingReminders(true);
                  setAttendanceAlerts(true);
                  setReportNotifications(false);
                  setAutoRefresh(true);
                  setSoundEnabled(true);
                  setTheme('light');
                  
                  toast({
                    title: "Settings reset",
                    description: "All settings have been reset to defaults.",
                  });
                }}
                className="w-full justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All Settings
              </Button>
              <p className="text-xs text-gray-500">
                Reset all preferences to default values
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Name:</span> {user.name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Role:</span> {user.role}
              </div>
              {user.company && (
                <div className="text-sm">
                  <span className="font-medium">Company:</span> {user.company}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Account & Security
            </CardTitle>
            <CardDescription>
              Manage your account and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/profile")}
            >
              <Globe className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={clearCache}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear App Data
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About CEDOI Forum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Role:</strong> {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'}</p>
              <p><strong>User ID:</strong> {user?.id?.substring(0, 8)}...</p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
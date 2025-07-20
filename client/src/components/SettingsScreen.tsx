import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    role: user?.role || 'member'
  });
  const [notifications, setNotifications] = useState({
    meetingReminders: true,
    attendanceAlerts: true,
    reportUpdates: false,
    emailNotifications: true
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY'
  });

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('cedoi-notifications', JSON.stringify(notifications));
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cedoi-preferences', JSON.stringify(preferences));
    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="w-10 h-10 rounded-2xl hover:bg-gray-100"
            >
              <span className="material-icons">arrow_back</span>
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-icons text-white text-lg">settings</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 pb-20 space-y-6">
        {/* Profile Settings */}
        <Card className="shadow-lg border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="material-icons mr-2 text-blue-600">person</span>
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={profile.role} disabled>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sonai">Sonai (Organizer)</SelectItem>
                    <SelectItem value="chairman">Chairman</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="material-icons mr-2 text-primary">notifications</span>
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="meetingReminders">Meeting Reminders</Label>
                <p className="text-sm text-gray-600">Get notified about upcoming meetings</p>
              </div>
              <Switch
                id="meetingReminders"
                checked={notifications.meetingReminders}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, meetingReminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="attendanceAlerts">Attendance Alerts</Label>
                <p className="text-sm text-gray-600">Get notified about attendance marking</p>
              </div>
              <Switch
                id="attendanceAlerts"
                checked={notifications.attendanceAlerts}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, attendanceAlerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reportUpdates">Report Updates</Label>
                <p className="text-sm text-gray-600">Get notified about new reports</p>
              </div>
              <Switch
                id="reportUpdates"
                checked={notifications.reportUpdates}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, reportUpdates: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, emailNotifications: checked })
                }
              />
            </div>
            <Button onClick={handleSaveNotifications} className="w-full">
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="material-icons mr-2 text-primary">tune</span>
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select value={preferences.theme} onValueChange={(value) => 
                setPreferences({ ...preferences, theme: value })
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={preferences.language} onValueChange={(value) => 
                setPreferences({ ...preferences, language: value })
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={preferences.timezone} onValueChange={(value) => 
                setPreferences({ ...preferences, timezone: value })
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => 
                setPreferences({ ...preferences, dateFormat: value })
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSavePreferences} className="w-full">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="material-icons mr-2 text-primary">security</span>
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="material-icons text-yellow-600 mr-2">info</span>
                Password changes and account management are handled through your organization's IT department.
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <span className="material-icons mr-2">logout</span>
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
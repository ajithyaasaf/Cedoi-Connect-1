import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Shield, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = () => {
    // In a real app, this would update the user profile
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully.",
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'chairman': return 'Chairman';
      case 'sonai': return 'Sonai (Attendance Marker)';
      case 'member': return 'Member';
      default: return 'Member';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'chairman': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sonai': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Avatar and Basic Info */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{user?.name || 'User'}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
            <div className="flex justify-center mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || 'member')}`}>
                <Shield className="h-3 w-3 mr-1" />
                {getRoleDisplayName(user?.role || 'member')}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true} // Email typically can't be changed
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-gray-500">Email address cannot be changed</p>
            </div>
            {isEditing && (
              <div className="flex space-x-2 pt-2">
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">User ID</span>
              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {user?.id?.substring(0, 8)}...
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || 'member')}`}>
                {getRoleDisplayName(user?.role || 'member')}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
              <span className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Permissions
            </CardTitle>
            <CardDescription>
              Based on your role: {getRoleDisplayName(user?.role || 'member')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.role === 'chairman' && (
                <>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm">Create and manage meetings</span>
                  </div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm">View attendance reports</span>
                  </div>
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm">Live attendance monitoring</span>
                  </div>
                </>
              )}
              {user?.role === 'sonai' && (
                <>
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
                    <span className="text-sm">Mark member attendance</span>
                  </div>
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
                    <span className="text-sm">View meeting schedules</span>
                  </div>
                </>
              )}
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm">View meeting notifications</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
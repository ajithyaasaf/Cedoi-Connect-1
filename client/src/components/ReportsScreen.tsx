import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Meeting, User } from '@shared/schema';

interface ReportsScreenProps {
  onBack: () => void;
}

export default function ReportsScreen({ onBack }: ReportsScreenProps) {
  const { toast } = useToast();

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: stats } = useQuery<{
    totalMeetings: number;
    averageAttendance: number;
    presentCount: number;
    absentCount: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const handleExport = (format: 'pdf' | 'csv') => {
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    // In a real app, this would trigger the export functionality
  };

  const topAttendees = users.filter(user => user.role === 'member').slice(0, 3);
  const activeMembers = users.filter(user => user.role === 'member').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-material">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
            >
              <span className="material-icons">arrow_back</span>
            </Button>
            <div>
              <h1 className="text-xl font-medium">Reports & Analytics</h1>
              <p className="text-sm opacity-90">Chairman Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleExport('pdf')}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
            >
              <span className="material-icons">file_download</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
            >
              <span className="material-icons">share</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 pb-20">
        {/* Export Actions */}
        <Card className="shadow-material mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Export Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => handleExport('pdf')}
                className="bg-accent hover:bg-accent/90 text-white py-3 px-4 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
              >
                <span className="material-icons mr-2">picture_as_pdf</span>
                PDF REPORT
              </Button>
              <Button
                onClick={() => handleExport('csv')}
                variant="outline"
                className="py-3 px-4 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
              >
                <span className="material-icons mr-2">table_chart</span>
                CSV EXPORT
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Total Meetings</h4>
                <span className="material-icons text-primary">event</span>
              </div>
              <div className="text-3xl font-semibold text-primary mb-1">
                {stats?.totalMeetings || 0}
              </div>
              <div className="text-sm text-success">+2 this month</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Average Attendance</h4>
                <span className="material-icons text-success">people</span>
              </div>
              <div className="text-3xl font-semibold text-primary mb-1">
                {stats?.averageAttendance || 0}%
              </div>
              <div className="text-sm text-success">+5% vs last month</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Active Members</h4>
                <span className="material-icons text-accent">person</span>
              </div>
              <div className="text-3xl font-semibold text-primary mb-1">
                {activeMembers}
              </div>
              <div className="text-sm text-gray-600">Total: {users.length} members</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Meeting Frequency</h4>
                <span className="material-icons text-primary">schedule</span>
              </div>
              <div className="text-3xl font-semibold text-primary mb-1">Weekly</div>
              <div className="text-sm text-gray-600">Every Sunday</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Trends */}
        <Card className="shadow-material mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Attendance Trends</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <span className="material-icons text-gray-400 text-4xl mb-2">bar_chart</span>
              <p className="text-gray-600">
                Attendance trend chart would be displayed here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Attendees */}
        <Card className="shadow-material">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Top Attendees</h3>
            
            <div className="space-y-3">
              {topAttendees.map((attendee, index) => (
                <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-success' : 'bg-accent'
                    }`}>
                      <span className="material-icons text-white text-sm">person</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{attendee.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{attendee.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      index === 0 ? 'text-success' : 'text-accent'
                    }`}>
                      {95 - index * 7}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats?.totalMeetings ? Math.floor((95 - index * 7) / 100 * stats.totalMeetings) : 0}/{stats?.totalMeetings || 0} meetings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

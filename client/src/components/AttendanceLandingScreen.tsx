import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Meeting } from '@shared/schema';

interface AttendanceLandingScreenProps {
  onSelectMeeting: (meetingId: string) => void;
}

export default function AttendanceLandingScreen({ onSelectMeeting }: AttendanceLandingScreenProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'today' | 'completed'>('all');

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.getAll(),
  });

  // Filter meetings based on user role
  const userMeetings = user?.role === 'sonai' ? 
    meetings.filter(meeting => meeting.createdBy === user.id) : 
    meetings; // Chairman and others can see all meetings

  // Filter meetings based on search and filter
  const filteredMeetings = userMeetings.filter(meeting => {
    const matchesSearch = meeting.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (meeting.theme && meeting.theme.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const meetingDate = new Date(meeting.date);
    const today = new Date();
    const isToday = meetingDate.toDateString() === today.toDateString();
    const isUpcoming = meetingDate > today;
    const isCompleted = meetingDate <= today && !isToday;
    
    let matchesFilter = true;
    if (selectedFilter === 'today') matchesFilter = isToday;
    else if (selectedFilter === 'upcoming') matchesFilter = isUpcoming;
    else if (selectedFilter === 'completed') matchesFilter = isCompleted;
    
    return matchesSearch && matchesFilter;
  });

  const getMeetingStatus = (meetingDate: Date) => {
    const today = new Date();
    const isToday = meetingDate.toDateString() === today.toDateString();
    const isUpcoming = meetingDate > today;
    
    if (isToday) return { label: 'Today', color: 'bg-green-100 text-green-800' };
    if (isUpcoming) return { label: 'Upcoming', color: 'bg-primary/10 text-primary' };
    return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-icons text-white text-lg">how_to_reg</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-600">Select a meeting to mark attendance</p>
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading meetings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="material-icons text-white text-lg">how_to_reg</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-600">
              {user?.role === 'sonai' ? 'Mark attendance for your meetings' : 'Mark attendance for meetings'}
            </p>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 pb-20">
        {/* Search and Filter */}
        <Card className="shadow-lg border-0 rounded-2xl mb-4">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Search meetings by venue or agenda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-gray-200"
                />
              </div>
              
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'today', label: 'Today' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'completed', label: 'Completed' }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={selectedFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.key as typeof selectedFilter)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 ${
                      selectedFilter === filter.key 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? (
          <Card className="shadow-lg border-0 rounded-2xl">
            <CardContent className="p-6 text-center">
              <span className="material-icons text-gray-400 text-4xl mb-3">event_busy</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try adjusting your search terms' : 'No meetings available for attendance marking'}
              </p>
              {user?.role === 'sonai' && (
                <p className="text-gray-500 text-sm mt-2">
                  Create a meeting from the Dashboard to mark attendance
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const meetingDate = new Date(meeting.date);
              const status = getMeetingStatus(meetingDate);
              
              return (
                <Card key={meeting.id} className="shadow-lg border-0 rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{meeting.venue}</h3>
                          <Badge className={`text-xs rounded-full ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="material-icons text-sm">schedule</span>
                            <span>
                              {meetingDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {meetingDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="material-icons text-sm">location_on</span>
                            <span>{meeting.venue}</span>
                          </div>
                          
                          {meeting.theme && (
                            <div className="flex items-start space-x-2">
                              <span className="material-icons text-sm mt-0.5">description</span>
                              <span className="break-words">{meeting.theme}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => onSelectMeeting(meeting.id)}
                        size="sm"
                        className="ml-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2"
                      >
                        <span className="material-icons mr-1 text-sm">how_to_reg</span>
                        Mark
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Meeting } from '@shared/schema';

interface MeetingsPageProps {
  onCreateMeeting: () => void;
  onMarkAttendance: (meetingId: string) => void;
  onViewLiveAttendance: (meetingId: string) => void;
}

export default function MeetingsPage({ onCreateMeeting, onMarkAttendance, onViewLiveAttendance }: MeetingsPageProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.getAll(),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.date) >= today
  );

  const pastMeetings = meetings.filter(meeting => 
    new Date(meeting.date) < today
  );

  const filteredMeetings = activeFilter === 'upcoming' ? upcomingMeetings : 
                          activeFilter === 'past' ? pastMeetings : meetings;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">All Meetings</h1>
        <p className="text-sm text-gray-600">Manage and view all forum meetings</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-4">
          {['all', 'upcoming', 'past'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'upcoming' ? 'Upcoming' : 'Past'}
              <span className="ml-2 text-xs">
                {filter === 'all' ? meetings.length : 
                 filter === 'upcoming' ? upcomingMeetings.length : pastMeetings.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Meeting Button - Chairman Only */}
      {user?.role === 'chairman' && user?.email?.includes('chairman') && (
        <div className="px-4 py-4">
          <Button
            onClick={onCreateMeeting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3"
          >
            <span className="material-icons text-sm mr-2">add</span>
            Schedule New Meeting
          </Button>
        </div>
      )}

      {/* Meetings List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-gray-200 rounded-2xl h-24"></Card>
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-icons text-6xl text-gray-300 mb-4 block">
              {activeFilter === 'upcoming' ? 'event_available' : 
               activeFilter === 'past' ? 'event_busy' : 'event_note'}
            </span>
            <p className="text-gray-500 mb-2">
              {activeFilter === 'upcoming' ? 'No upcoming meetings' :
               activeFilter === 'past' ? 'No past meetings' : 'No meetings found'}
            </p>
            {user?.role === 'chairman' && activeFilter !== 'past' && (
              <Button
                onClick={onCreateMeeting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 mt-2"
              >
                <span className="material-icons text-sm mr-2">add</span>
                Create First Meeting
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const meetingDate = new Date(meeting.date);
              const isToday = meetingDate.toDateString() === new Date().toDateString();
              const isPast = meetingDate < new Date();
              const isUpcoming = meetingDate > new Date();
              
              return (
                <Card key={meeting.id} className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isToday ? 'bg-green-500' : isPast ? 'bg-gray-400' : 'bg-blue-500'
                          }`}></div>
                          <Badge variant={isToday ? "default" : isPast ? "secondary" : "outline"} className="text-xs">
                            {isToday ? 'Today' : isPast ? 'Past' : 'Upcoming'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{meeting.venue}</h3>
                        {meeting.agenda && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{meeting.agenda}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span className="material-icons text-sm">schedule</span>
                            <span>{meetingDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="material-icons text-sm">calendar_today</span>
                            <span>{meetingDate.toLocaleDateString('en-IN', { 
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-3">
                        {(user?.role === 'chairman' || user?.role === 'sonai') && (isToday || !isPast) && (
                          <Button
                            size="sm"
                            onClick={() => onViewLiveAttendance(meeting.id)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 text-xs rounded-full"
                          >
                            <span className="material-icons text-sm">visibility</span>
                          </Button>
                        )}
                        {!isPast && (
                          <Button
                            size="sm"
                            onClick={() => onMarkAttendance(meeting.id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-xs rounded-full"
                          >
                            <span className="material-icons text-sm">check_circle</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
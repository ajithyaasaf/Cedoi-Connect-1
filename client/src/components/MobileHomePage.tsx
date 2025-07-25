import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Meeting, User } from '@shared/schema';

interface MobileHomePageProps {
  onCreateMeeting: () => void;
  onMarkAttendance: (meetingId: string) => void;
  onViewLiveAttendance: (meetingId: string) => void;
}

export default function MobileHomePage({ onCreateMeeting, onMarkAttendance, onViewLiveAttendance }: MobileHomePageProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming'>('today');

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.meetings.getAll(),
  });

  const { data: todaysMeeting } = useQuery<Meeting | null>({
    queryKey: ['meetings', 'today'],
    queryFn: () => api.meetings.getTodaysMeeting(),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.attendance.getStats(),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysDate = new Date();
  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.date) > todaysDate
  );

  // Note: Meeting creation is now restricted to Chairman only
  const isChairmanOrSonai = user?.role === 'chairman' || user?.role === 'sonai';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Status Card */}
      <div className="bg-primary px-4 py-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</h2>
              <p className="text-white/80 capitalize">{user?.name}</p>
            </div>

          </div>

          {/* Today's Status */}
          {todaysMeeting ? (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="material-icons text-lg text-green-300" aria-hidden="true">event_available</span>
                    <span className="font-semibold text-white">Today's Meeting</span>
                  </div>
                  <h3 className="text-base font-medium text-white mb-2 truncate" title={todaysMeeting.venue}>
                    {todaysMeeting.venue}
                  </h3>
                  <p className="text-sm text-white/70 flex items-center">
                    <span className="material-icons text-sm mr-1" aria-hidden="true">schedule</span>
                    {new Date(todaysMeeting.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 flex-shrink-0">
                  {isChairmanOrSonai && (
                    <Button
                      size="sm"
                      onClick={() => onViewLiveAttendance(todaysMeeting.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-xs rounded-full shadow-md transition-all duration-200 hover:shadow-lg"
                      aria-label="View live attendance"
                    >
                      <span className="material-icons text-sm mr-1" aria-hidden="true">live_tv</span>
                      Live
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onMarkAttendance(todaysMeeting.id)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-xs rounded-full border border-white/30 backdrop-blur-sm transition-all duration-200 hover:bg-white/40"
                    aria-label="Mark attendance"
                  >
                    <span className="material-icons text-sm mr-1" aria-hidden="true">check_circle</span>
                    Mark
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-center">
              <span className="material-icons text-2xl opacity-50 mb-2 block">event_busy</span>
              <p className="text-sm opacity-75">No meetings scheduled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4 relative z-10 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white shadow-lg border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="material-icons text-primary text-xl">groups</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalMeetings || 0}</div>
              <div className="text-xs text-gray-500">Total Meetings</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0 rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="material-icons text-green-600 text-xl">trending_up</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats?.averageAttendance || 0}%</div>
              <div className="text-xs text-gray-500">Avg Attendance</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions - Chairman Only */}
      {user?.role === 'chairman' && user?.email?.includes('chairman') && (
        <div className="px-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex justify-center">
            <Button
              onClick={onCreateMeeting}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-16 w-48 flex flex-col items-center justify-center space-y-1 shadow-lg"
            >
              <span className="material-icons text-xl">add_circle</span>
              <span className="text-xs font-medium">New Meeting</span>
            </Button>
          </div>
        </div>
      )}

      {/* Meeting Filter */}
      <div className="px-4 mb-4">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['today', 'upcoming', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter === 'today' ? 'Today' : filter === 'upcoming' ? 'Upcoming' : 'All Meetings'}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-gray-200 rounded-2xl h-24"></Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(activeFilter === 'today' ? (todaysMeeting ? [todaysMeeting] : []) :
              activeFilter === 'upcoming' ? upcomingMeetings :
              meetings
            ).slice(0, 10).map((meeting) => {
              const meetingDate = new Date(meeting.date);
              const isToday = meetingDate.toDateString() === new Date().toDateString();
              const isPast = meetingDate < new Date();
              
              return (
                <Card key={meeting.id} className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isToday ? 'bg-green-500' : isPast ? 'bg-gray-400' : 'bg-primary'
                          }`}></div>
                          <Badge variant={isToday ? "default" : isPast ? "secondary" : "outline"} className="text-xs">
                            {isToday ? 'Today' : isPast ? 'Completed' : 'Upcoming'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{meeting.venue}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{meeting.theme}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span className="material-icons text-sm">schedule</span>
                            <span>{meetingDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="material-icons text-sm">calendar_today</span>
                            <span>{meetingDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-3">
                        {isChairmanOrSonai && (isToday || !isPast) && (
                          <Button
                            size="sm"
                            onClick={() => onViewLiveAttendance(meeting.id)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 text-xs rounded-full"
                          >
                            <span className="material-icons text-sm">visibility</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => onMarkAttendance(meeting.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-xs rounded-full"
                        >
                          <span className="material-icons text-sm">check_circle</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (
          activeFilter === 'today' ? (todaysMeeting ? null : (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-gray-300 mb-4 block">event_busy</span>
              <p className="text-gray-500 mb-2">No meetings scheduled for today</p>
              {user?.role === 'chairman' && user?.email?.includes('chairman') && (
                <Button
                  onClick={onCreateMeeting}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-2 mt-2"
                >
                  <span className="material-icons text-sm mr-2">add</span>
                  Schedule Meeting
                </Button>
              )}
            </div>
          )) :
          activeFilter === 'upcoming' && upcomingMeetings.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-gray-300 mb-4 block">event_available</span>
              <p className="text-gray-500">No upcoming meetings</p>
            </div>
          ) :
          meetings.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-gray-300 mb-4 block">event_note</span>
              <p className="text-gray-500 mb-2">No meetings found</p>
              {user?.role === 'chairman' && user?.email?.includes('chairman') && (
                <Button
                  onClick={onCreateMeeting}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-2 mt-2"
                >
                  <span className="material-icons text-sm mr-2">add</span>
                  Create First Meeting
                </Button>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
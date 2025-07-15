import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-new';
import { notificationService } from '@/lib/notifications';

interface CreateMeetingScreenProps {
  onBack: () => void;
}

export default function CreateMeetingScreen({ onBack }: CreateMeetingScreenProps) {
  const [date, setDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [venue, setVenue] = useState('Mariat Hotel, Madurai');
  const [customVenue, setCustomVenue] = useState('');
  const [agenda, setAgenda] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      return api.meetings.create(meetingData);
    },
    onSuccess: async (createdMeeting) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      
      // Send notifications if enabled
      if (notifyMembers) {
        try {
          const users = await api.users.getAll();
          const userIds = users.map(user => user.id);
          
          await notificationService.notifyMeetingCreated({
            date: createdMeeting.date,
            venue: createdMeeting.venue,
            agenda: createdMeeting.agenda || ''
          }, userIds);
        } catch (error) {
          console.error('Failed to send notifications:', error);
        }
      }

      // Schedule reminder if enabled
      if (sendReminder) {
        try {
          const users = await api.users.getAll();
          const userIds = users.map(user => user.id);
          
          notificationService.scheduleReminder(
            createdMeeting.date,
            {
              date: createdMeeting.date,
              venue: createdMeeting.venue,
              agenda: createdMeeting.agenda || ''
            },
            userIds
          );
        } catch (error) {
          console.error('Failed to schedule reminder:', error);
        }
      }

      toast({
        title: "Meeting Created",
        description: "The meeting has been scheduled successfully.",
      });
      onBack();
    },
    onError: (error: any) => {
      console.error('Meeting creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !selectedHour || !selectedMinute || !selectedPeriod || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(selectedHour);
    if (selectedPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (selectedPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    }

    const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute}:00`;
    const meetingDateTime = new Date(`${date}T${timeString}`);
    
    // Ensure the datetime is valid
    if (isNaN(meetingDateTime.getTime())) {
      toast({
        title: "Invalid Date/Time",
        description: "Please select a valid date and time.",
        variant: "destructive",
      });
      return;
    }
    
    const finalVenue = venue === 'custom' ? customVenue : venue;
    
    if (!finalVenue.trim()) {
      toast({
        title: "Missing Venue",
        description: "Please specify a venue for the meeting.",
        variant: "destructive",
      });
      return;
    }
    
    const meetingData = {
      date: meetingDateTime,
      venue: finalVenue,
      agenda: agenda || "",
      createdBy: user.id,
      repeatWeekly,
      isActive: true,
    };

    console.log('Meeting data being sent:', meetingData);
    createMeetingMutation.mutate(meetingData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
              <span className="material-icons">arrow_back</span>
            </Button>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Create Meeting</h1>
              <p className="text-sm text-gray-600">Schedule new meeting</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <span className="material-icons">help_outline</span>
          </Button>
        </div>
      </div>

      <main className="p-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Time */}
          <Card className="shadow-material">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Date & Time</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                    Date
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Time
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">Hour</Label>
                      <Select value={selectedHour} onValueChange={setSelectedHour}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Minute</Label>
                      <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {['00', '15', '30', '45'].map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Period</Label>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedHour && selectedMinute && selectedPeriod && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <span className="material-icons text-sm mr-1">schedule</span>
                      Selected: {selectedHour}:{selectedMinute} {selectedPeriod}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox
                  id="repeat"
                  checked={repeatWeekly}
                  onCheckedChange={(checked) => setRepeatWeekly(checked as boolean)}
                />
                <Label htmlFor="repeat" className="text-sm text-foreground">
                  Repeat weekly
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Venue */}
          <Card className="shadow-material">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Venue</h3>
              <div className="space-y-4">
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mariat Hotel, Madurai">Mariat Hotel, Madurai</SelectItem>
                    <SelectItem value="CEDOI Office, Madurai">CEDOI Office, Madurai</SelectItem>
                    <SelectItem value="Community Hall, Madurai">Community Hall, Madurai</SelectItem>
                    <SelectItem value="Online Meeting (Zoom)">Online Meeting (Zoom)</SelectItem>
                    <SelectItem value="custom">Custom Venue</SelectItem>
                  </SelectContent>
                </Select>
                
                {venue === 'custom' && (
                  <div>
                    <Label htmlFor="customVenue" className="text-sm font-medium text-foreground">
                      Enter custom venue
                    </Label>
                    <Input
                      id="customVenue"
                      value={customVenue}
                      onChange={(e) => setCustomVenue(e.target.value)}
                      placeholder="Enter venue address or details"
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <span className="material-icons text-blue-600">location_on</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {venue === 'custom' ? (customVenue || 'Custom venue') : venue}
                    </p>
                    <p className="text-xs text-blue-600">Meeting location</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card className="shadow-material">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Agenda</h3>
              <Textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Enter meeting agenda and topics to discuss..."
                rows={4}
                className="w-full resize-none"
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-material">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify"
                    checked={notifyMembers}
                    onCheckedChange={(checked) => setNotifyMembers(checked as boolean)}
                  />
                  <Label htmlFor="notify" className="text-sm text-foreground">
                    Notify all members
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder"
                    checked={sendReminder}
                    onCheckedChange={(checked) => setSendReminder(checked as boolean)}
                  />
                  <Label htmlFor="reminder" className="text-sm text-foreground">
                    Send reminder 1 hour before
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="shadow-material">
            <CardContent className="p-4">
              <Button
                type="submit"
                disabled={createMeetingMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg font-medium text-sm uppercase tracking-wide ripple"
              >
                {createMeetingMutation.isPending ? 'CREATING...' : 'CREATE MEETING'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}

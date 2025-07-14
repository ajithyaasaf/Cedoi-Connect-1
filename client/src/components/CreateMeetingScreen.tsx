import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface CreateMeetingScreenProps {
  onBack: () => void;
}

export default function CreateMeetingScreen({ onBack }: CreateMeetingScreenProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [agenda, setAgenda] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      return apiRequest('POST', '/api/meetings', meetingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: "Meeting Created",
        description: "The meeting has been scheduled successfully.",
      });
      onBack();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !user) return;

    const meetingDateTime = new Date(`${date}T${time}`);
    
    const meetingData = {
      date: meetingDateTime.toISOString(),
      venue: "Mariat Hotel, Madurai",
      agenda,
      createdBy: user.id,
      repeatWeekly,
      isActive: true,
    };

    createMeetingMutation.mutate(meetingData);
  };

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
              <h1 className="text-xl font-medium">Create Meeting</h1>
              <p className="text-sm opacity-90">Schedule new meeting</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
          >
            <span className="material-icons">help_outline</span>
          </Button>
        </div>
      </header>

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
                  <Label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full"
                  />
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
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="material-icons text-accent">location_on</span>
                <div>
                  <p className="font-medium text-foreground">Mariat Hotel, Madurai</p>
                  <p className="text-sm text-gray-600">Default venue</p>
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

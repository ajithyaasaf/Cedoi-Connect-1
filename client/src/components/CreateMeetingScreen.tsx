import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { notificationService } from "@/lib/notifications";

interface CreateMeetingScreenProps {
  onBack: () => void;
}

export default function CreateMeetingScreen({
  onBack,
}: CreateMeetingScreenProps) {
  const { user } = useAuth();

  // Redirect if user is not chairman
  if (user?.role !== 'chairman') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center p-6">
          <span className="material-icons text-6xl text-red-400 mb-4 block">block</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only Chairman users can create meetings.</p>
          <Button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
          >
            <span className="material-icons text-sm mr-2">arrow_back</span>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const [date, setDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [selectedSecond, setSelectedSecond] = useState("0");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [venue, setVenue] = useState("Mariat Hotel, Madurai");
  const [customVenue, setCustomVenue] = useState("");
  const [agenda, setAgenda] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      return api.meetings.create(meetingData);
    },
    onSuccess: async (createdMeeting) => {
      // Invalidate all meeting-related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meetings", "today"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      // Send notifications if enabled
      if (notifyMembers) {
        try {
          const users = await api.users.getAll();
          const userIds = users.map((user) => user.id);

          await notificationService.notifyMeetingCreated(
            {
              date: createdMeeting.date,
              venue: createdMeeting.venue,
              agenda: createdMeeting.agenda || "",
            },
            userIds,
          );
        } catch (error) {
          console.error("Failed to send notifications:", error);
        }
      }

      // Schedule reminder if enabled
      if (sendReminder) {
        try {
          const users = await api.users.getAll();
          const userIds = users.map((user) => user.id);

          notificationService.scheduleReminder(
            createdMeeting.date,
            {
              date: createdMeeting.date,
              venue: createdMeeting.venue,
              agenda: createdMeeting.agenda || "",
            },
            userIds,
          );
        } catch (error) {
          console.error("Failed to schedule reminder:", error);
        }
      }

      toast({
        title: "Meeting Created",
        description: "The meeting has been scheduled successfully.",
      });
      onBack();
    },
    onError: (error: any) => {
      console.error("Meeting creation error:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Failed to create meeting. Please try again.",
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
    if (selectedPeriod === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (selectedPeriod === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const timeString = `${hour24.toString().padStart(2, "0")}:${selectedMinute.padStart(2, "0")}:${selectedSecond.padStart(2, "0")}`;
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

    const finalVenue = venue === "custom" ? customVenue : venue;

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

    console.log("Meeting data being sent:", meetingData);
    createMeetingMutation.mutate(meetingData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
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
              <span className="material-icons text-white text-lg">event</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Create Meeting
              </h1>
              <p className="text-sm text-gray-600">
                Schedule new meeting
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 min-w-[44px] min-h-[44px] hidden sm:flex"
          >
            <span className="material-icons">help_outline</span>
          </Button>
        </div>
      </div>

      <main className="px-4 py-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Time */}
          <Card className="shadow-lg border-0 rounded-2xl">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-lg font-medium text-foreground mb-3 sm:mb-4 flex items-center">
                <span className="material-icons mr-2 text-accent">event</span>
                Date & Time
              </h3>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="date"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Meeting Date
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full h-12 text-base"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Meeting Time
                  </Label>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Hour
                      </Label>
                      <Select
                        value={selectedHour}
                        onValueChange={setSelectedHour}
                      >
                        <SelectTrigger className="w-full h-12 text-base">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (hour) => (
                              <SelectItem key={hour} value={hour.toString()}>
                                {hour}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Minute
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={selectedMinute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                            setSelectedMinute(value);
                          }
                        }}
                        placeholder="00"
                        className="w-full h-12 text-base text-center"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Second
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={selectedSecond}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                            setSelectedSecond(value);
                          }
                        }}
                        placeholder="00"
                        className="w-full h-12 text-base text-center"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Period
                      </Label>
                      <Select
                        value={selectedPeriod}
                        onValueChange={setSelectedPeriod}
                      >
                        <SelectTrigger className="w-full h-12 text-base">
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
                    <div className="mt-3 p-2 bg-accent/10 rounded-lg flex items-center">
                      <span className="material-icons text-accent text-sm mr-2">
                        schedule
                      </span>
                      <span className="text-sm text-accent font-medium">
                        Selected: {selectedHour}:{selectedMinute.padStart(2, "0")}:{selectedSecond.padStart(2, "0")}{" "}
                        {selectedPeriod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="repeat"
                  checked={repeatWeekly}
                  onCheckedChange={(checked) =>
                    setRepeatWeekly(checked as boolean)
                  }
                  className="min-w-[20px] min-h-[20px]"
                />
                <Label
                  htmlFor="repeat"
                  className="text-sm text-foreground cursor-pointer"
                >
                  Repeat weekly (every week at the same time)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Venue */}
          <Card className="shadow-material">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-lg font-medium text-foreground mb-3 sm:mb-4 flex items-center">
                <span className="material-icons mr-2 text-accent">
                  location_on
                </span>
                Venue
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Select Meeting Location
                  </Label>
                  <Select value={venue} onValueChange={setVenue}>
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="Choose a venue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mariat Hotel, Madurai">
                        Mariat Hotel, Madurai
                      </SelectItem>
                      <SelectItem value="CEDOI Office, Madurai">
                        CEDOI Office, Madurai
                      </SelectItem>
                      <SelectItem value="Community Hall, Madurai">
                        Community Hall, Madurai
                      </SelectItem>
                      <SelectItem value="Online Meeting (Zoom)">
                        Online Meeting (Zoom)
                      </SelectItem>
                      <SelectItem value="custom">Custom Venue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {venue === "custom" && (
                  <div>
                    <Label
                      htmlFor="customVenue"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Enter Custom Venue
                    </Label>
                    <Input
                      id="customVenue"
                      value={customVenue}
                      onChange={(e) => setCustomVenue(e.target.value)}
                      placeholder="Enter venue address or details"
                      className="h-12 text-base"
                    />
                  </div>
                )}

                {venue && (
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <span className="material-icons text-blue-600 mt-0.5">
                      location_on
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 break-words">
                        {venue === "custom"
                          ? customVenue || "Custom venue"
                          : venue}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Meeting location
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card className="shadow-material">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-lg font-medium text-foreground mb-3 sm:mb-4 flex items-center">
                <span className="material-icons mr-2 text-accent">
                  description
                </span>
                Purpose of Meeting
              </h3>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">
                  Meeting Topics & Discussion Points
                </Label>
                <Textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Enter meeting Purpose and topics to discuss..."
                  rows={4}
                  className="w-full resize-none text-base min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-2">Optional</p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-material">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-lg font-medium text-foreground mb-3 sm:mb-4 flex items-center">
                <span className="material-icons mr-2 text-accent">
                  notifications
                </span>
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="notify"
                    checked={notifyMembers}
                    onCheckedChange={(checked) =>
                      setNotifyMembers(checked as boolean)
                    }
                    className="min-w-[20px] min-h-[20px] mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="notify"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Notify all members
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Send notification to all forum members about this meeting
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="reminder"
                    checked={sendReminder}
                    onCheckedChange={(checked) =>
                      setSendReminder(checked as boolean)
                    }
                    className="min-w-[20px] min-h-[20px] mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="reminder"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Send reminder 1 hour before
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatic reminder will be sent to all members
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="shadow-material">
            <CardContent className="p-3 sm:p-4">
              <Button
                type="submit"
                disabled={createMeetingMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-medium text-base sm:text-sm uppercase tracking-wide ripple min-h-[56px] transition-all duration-200"
              >
                {createMeetingMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>CREATING...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="material-icons">add_circle</span>
                    <span>CREATE MEETING</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}

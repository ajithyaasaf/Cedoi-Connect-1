import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const faqData = [
  {
    question: "How do I mark attendance for a meeting?",
    answer: "Navigate to the Attendance tab, select the meeting, and toggle the attendance status for each member. You can also use the QR scanner for quick check-ins."
  },
  {
    question: "Who can create meetings?",
    answer: "Only users with Chairman role can create meetings. Sonai users can mark attendance, while Members can view meeting information."
  },
  {
    question: "How do I view attendance reports?",
    answer: "Go to the Reports section to view detailed attendance analytics, export data, and see member statistics over different time periods."
  },
  {
    question: "What is the Live Monitor feature?",
    answer: "Live Monitor (available for Chairman) shows real-time attendance updates during meetings with auto-refresh capabilities and filtering options."
  },
  {
    question: "Can I use the app offline?",
    answer: "The app has limited offline capabilities. You can view previously loaded data, but marking attendance and creating meetings requires an internet connection."
  },
  {
    question: "How do I change my profile information?",
    answer: "Go to Profile from the menu to update your personal information. Email addresses cannot be changed for security reasons."
  }
];

export default function HelpSupport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: ''
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send the message to support
    toast({
      title: "Support request sent",
      description: "We'll get back to you within 24 hours.",
    });
    
    setContactForm({ subject: '', message: '', email: '' });
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Help & Support</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Quick Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Quick Help
            </CardTitle>
            <CardDescription>
              Common actions and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <span className="material-icons text-sm mr-2">event</span>
              How to create a meeting
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span className="material-icons text-sm mr-2">check_circle</span>
              How to mark attendance
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span className="material-icons text-sm mr-2">assessment</span>
              How to view reports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span className="material-icons text-sm mr-2">qr_code_scanner</span>
              How to use QR scanner
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {faqData.map((faq, index) => (
              <Collapsible key={index} open={openFAQ === index} onOpenChange={() => toggleFAQ(index)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left">
                    <span className="text-sm font-medium">{faq.question}</span>
                    {openFAQ === index ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Send us a message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your issue or question in detail..."
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Other ways to reach us
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">support@cedoi.org</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+91 422 XXX XXXX</p>
                <p className="text-xs text-gray-500">Mon-Fri, 9 AM - 6 PM IST</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full">
                <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Documentation</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visit our help center</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
              <span className="text-sm font-medium">July 2025</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Platform</span>
              <span className="text-sm font-medium">Progressive Web App</span>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Emergency Contact</CardTitle>
            <CardDescription>
              For urgent issues during meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Call Emergency Support
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Available 24/7 for critical meeting issues
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
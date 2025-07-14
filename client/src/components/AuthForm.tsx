import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, sendOTP } = useAuth();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await sendOTP(email);
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the OTP code.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, otp);
      toast({
        title: "Login Successful",
        description: "Welcome to CEDOI Madurai Forum!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="slide-up shadow-material-lg">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-white text-3xl">groups</span>
              </div>
              <h1 className="text-2xl font-medium text-primary mb-2">CEDOI Madurai Forum</h1>
              <p className="text-foreground text-base">Meeting Management System</p>
            </div>
            
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={otpSent}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
              
              {otpSent && (
                <div className="fade-in">
                  <Label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                    Enter OTP
                  </Label>
                  <Input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center">OTP sent to your email</p>
                </div>
              )}
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg font-medium text-sm uppercase tracking-wide ripple transition-colors"
              >
                {loading ? 'LOADING...' : (otpSent ? 'VERIFY OTP' : 'SEND OTP')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

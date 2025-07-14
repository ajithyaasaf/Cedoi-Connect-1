import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome to CEDOI Madurai Forum!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 p-2 shadow-lg">
            <img 
              src="https://static.wixstatic.com/media/1a4736_ad22f191e98e4fb1a0d013093676fccf~mv2.jpg/v1/fill/w_160,h_90,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/1a4736_ad22f191e98e4fb1a0d013093676fccf~mv2.jpg" 
              alt="CEDOI Logo" 
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="material-icons text-primary text-3xl hidden">groups</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">CEDOI Madurai</h2>
          <p className="text-white opacity-90 text-sm">Meeting Management System</p>
        </div>
        <Card className="slide-up shadow-material-lg">
          <CardContent className="pt-8">
            
            <form onSubmit={handleLogin} className="space-y-6">
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
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg font-medium text-sm uppercase tracking-wide ripple transition-colors"
              >
                {loading ? 'LOADING...' : 'LOGIN'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">Demo Credentials:</p>
              <p className="text-xs text-gray-500 mt-2">
                Sonai: sonai@cedoi.com / sonai123<br />
                Chairman: chairman@cedoi.com / chairman123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

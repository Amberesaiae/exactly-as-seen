import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { isPasswordStrong } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { motion } from 'framer-motion';
import { AuthPanel } from '@/components/landing/LandingDecorations';

export default function Register() {
  const { user, loading, farmReady, signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    if (farmReady === true) return <Navigate to="/dashboard" replace />;
    if (farmReady === false) return <Navigate to="/farm-setup" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !farmName) return;
    if (!isPasswordStrong(password)) {
      toast.error('Password does not meet strength requirements');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName, farmName);
    setSubmitting(false);
    if (error) {
      toast.error('Registration failed', { description: error.message });
    } else {
      toast.success('Account created! Welcome to LampFarms.');
      navigate('/farm-setup');
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error('Google sign-in failed', { description: String(result.error) });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — Form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          <Link to="/welcome" className="inline-block mb-10 text-xl font-black uppercase tracking-tight text-foreground">
            LampFarms
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">Create Account</h1>
          <p className="text-muted-foreground text-sm mb-8">Start managing your poultry farm today</p>

          <Button variant="outline" onClick={handleGoogleSignIn} className="w-full gap-2 rounded-full font-medium mb-5 h-11">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign up with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Kwame Mensah" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Strong password" required minLength={8} className="h-11 rounded-xl" />
              <PasswordStrengthIndicator password={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input id="farmName" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="My Poultry Farm" required className="h-11 rounded-xl" />
            </div>
            <Button type="submit" disabled={submitting} className="mt-1 w-full rounded-full font-semibold h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </div>
          <div className="mt-3 text-center">
            <Link to="/welcome" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to home
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right — Decorative Panel */}
      <AuthPanel />
    </div>
  );
}

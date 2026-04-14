import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { isPasswordStrong } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { motion } from 'framer-motion';
import { AuthPanel } from '@/components/landing/LandingDecorations';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setValid(true);
    } else {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setValid(true);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (!isPasswordStrong(password)) { toast.error('Password does not meet strength requirements'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to update password', { description: error.message });
    } else {
      toast.success('Password updated successfully!');
      navigate('/dashboard', { replace: true });
    }
  };

  if (!valid) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <p className="text-muted-foreground mb-4">Invalid or expired reset link. Please request a new one.</p>
          <Button onClick={() => navigate('/forgot-password')} className="rounded-full">Request New Link</Button>
        </div>
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
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

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">Set New Password</h1>
          <p className="text-muted-foreground text-sm mb-8">Enter your new password below</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Strong password" required minLength={8} className="h-11 rounded-xl" />
              <PasswordStrengthIndicator password={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" required minLength={6} className="h-11 rounded-xl" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-full font-semibold h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Update Password</>}
            </Button>
          </form>
        </motion.div>
      </div>

      <AuthPanel />
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AuthPanel } from '@/components/landing/LandingDecorations';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to send reset email', { description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          <Link to="/welcome" className="inline-flex items-center gap-2 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">LampFarms</span>
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">Reset Password</h1>
          <p className="text-muted-foreground text-sm mb-8">
            {sent ? 'Check your email for a reset link' : "Enter your email and we'll send you a reset link"}
          </p>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Mail className="h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link.
              </p>
              <Button variant="outline" onClick={() => setSent(false)} className="rounded-full">
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11 rounded-xl" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full rounded-full font-semibold h-11">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      <AuthPanel />
    </div>
  );
}

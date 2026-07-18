import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User, Lock, LogOut, Loader2, CheckCircle2, Clock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { isPasswordStrong } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { format } from 'date-fns';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileTabProps {
  user: SupabaseUser | null;
  fullName: string;
  setFullName: (val: string) => void;
  saving: string | null;
  savedSection: string | null;
  saveProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export default function ProfileTab({
  user,
  fullName,
  setFullName,
  saving,
  savedSection,
  saveProfile,
  signOut,
}: ProfileTabProps) {
  // Local Password states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      toast.error('Password does not meet strength requirements');
      return;
    }
    setPasswordSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    }
  };

  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Personal Information
          </CardTitle>
          <CardDescription>Manage your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="profile-full-name">Full Name</Label>
            <Input
              id="profile-full-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-email">Email</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="profile-email"
                value={user?.email ?? ''}
                disabled
                className="bg-muted flex-1"
              />
              <Badge variant="secondary" className="text-xs shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Verified
              </Badge>
            </div>
          </div>
          {memberSince && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Member since {memberSince}
            </p>
          )}
          <Button
            size="sm"
            onClick={saveProfile}
            disabled={saving === 'profile'}
            className="rounded-full gap-1"
          >
            {saving === 'profile' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedSection === 'profile' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {savedSection === 'profile' ? 'Saved!' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Security / Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Password & Security
          </CardTitle>
          <CardDescription>Update your login credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2 rounded-full" onClick={() => setShowPasswordDialog(true)}>
            <Lock className="h-4 w-4" /> Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Session / Logout */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Session</p>
            <p className="text-xs text-muted-foreground">Sign out of this browser session</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a strong password to secure your farm data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1 relative">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div className="space-y-1 relative">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="rounded-full">Cancel</Button>
            <Button onClick={changePassword} disabled={passwordSubmitting} className="rounded-full">
              {passwordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

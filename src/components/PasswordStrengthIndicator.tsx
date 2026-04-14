import { validatePassword } from '@/lib/password-validation';
import { Check, X } from 'lucide-react';

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = validatePassword(password);
  if (!password) return null;

  const metCount = checks.filter((c) => c.met).length;
  const strength = metCount <= 2 ? 'Weak' : metCount <= 4 ? 'Fair' : 'Strong';
  const strengthColor =
    metCount <= 2 ? 'bg-destructive' : metCount <= 4 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= metCount ? strengthColor : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium">{strength}</span>
      </p>
      {/* Checklist */}
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={c.met ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Auth gate aligned with research Core Flows:
 * - anonymous → /welcome
 * - authenticated, setup incomplete → /farm-setup (except when already there)
 * - authenticated + setup complete → children
 */
export function ProtectedRoute({
  children,
  requireSetupComplete = true,
}: {
  children: React.ReactNode;
  /** When false, only login is required (used for /farm-setup). */
  requireSetupComplete?: boolean;
}) {
  const { user, loading, farmReady } = useAuth();
  const location = useLocation();

  if (loading || (user && farmReady === null && requireSetupComplete)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }

  if (requireSetupComplete && farmReady === false) {
    return <Navigate to="/farm-setup" replace />;
  }

  // Setup already done — don't stay on wizard
  if (!requireSetupComplete && farmReady === true && location.pathname === '/farm-setup') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

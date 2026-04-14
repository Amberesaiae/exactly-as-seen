import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Welcome() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-sm flex-col items-center gap-8 text-center"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sprout className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LampFarms</h1>
        </div>

        <p className="text-muted-foreground text-lg leading-relaxed">
          Smart poultry farm management. Track batches, monitor health, and grow your farm with confidence.
        </p>

        <div className="flex w-full flex-col gap-3">
          <Button asChild size="lg" className="w-full rounded-full text-base font-semibold">
            <Link to="/register">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-full text-base font-semibold">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

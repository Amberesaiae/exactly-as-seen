import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Clock, RefreshCw, Cpu, Server, HardDrive } from 'lucide-react';

const CRON_JOBS = [
  {
    name: 'advance-batch-weeks',
    schedule: '0 0 * * 0 (Sundays 00:00)',
    description: 'Increments active batch weeks and recomputes growth phases.',
    status: 'Healthy',
  },
  {
    name: 'check-withdrawal-periods',
    schedule: '*/30 * * * * (Every 30m)',
    description: 'Scans and clears drug withdrawal locks if safety periods have elapsed.',
    status: 'Healthy',
  },
  {
    name: 'generate-daily-tasks',
    schedule: '0 6 * * * (Daily 06:00)',
    description: 'Generates standard feeding and vaccination tasks based on FSM state.',
    status: 'Healthy',
  },
  {
    name: 'prune-idempotency-keys',
    schedule: '0 2 * * * (Daily 02:00)',
    description: 'Clears expired idempotency logs to maintain optimal storage indexing.',
    status: 'Healthy',
  },
];

export default function SystemTab() {
  const [outboxCount, setOutboxCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [latency, setLatency] = useState(42);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor online status
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Load queue counts
    const loadQueueStats = async () => {
      try {
        const outbox = await db.sync_outbox.count();
        const conflicts = await db.conflicts.count();
        setOutboxCount(outbox);
        setConflictCount(conflicts);
      } catch (e) {
        console.error('Failed to query Dexie stats', e);
      }
    };
    
    loadQueueStats();
    const interval = setInterval(loadQueueStats, 3000);

    // Simulate latency shifts
    const latencyInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 30);
    }, 5000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
      clearInterval(latencyInterval);
    };
  }, []);

  return (
    <div className="space-y-4 mt-4">
      {/* Real-time sync console */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xxs text-muted-foreground uppercase font-bold tracking-wider">Sync Outbox Queue</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-primary">{outboxCount}</p>
              <RefreshCw className={`h-5 w-5 text-primary ${outboxCount > 0 ? 'animate-spin' : ''}`} />
            </div>
            <p className="text-xxs text-muted-foreground">Pending offline logs</p>
          </CardContent>
        </Card>

        <Card className={conflictCount > 0 ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/20"}>
          <CardContent className="p-4 space-y-1">
            <p className="text-xxs text-muted-foreground uppercase font-bold tracking-wider">Conflict / DLQ Count</p>
            <div className="flex items-center justify-between">
              <p className={conflictCount > 0 ? "text-2xl font-bold text-destructive" : "text-2xl font-bold text-primary"}>{conflictCount}</p>
              <Database className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xxs text-muted-foreground">Dead-letter queue records</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-xxs text-muted-foreground uppercase font-bold tracking-wider">API Gate Latency</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-primary">{isOnline ? `${latency}ms` : 'Offline'}</p>
              <Activity className={`h-5 w-5 ${isOnline ? 'text-emerald-500 animate-pulse' : 'text-destructive'}`} />
            </div>
            <p className="text-xxs text-muted-foreground">{isOnline ? 'Excellent (Kong Gateway)' : 'Connection lost'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Systems / Scheduled cron jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" /> Database pg_cron Engine
          </CardTitle>
          <CardDescription>Scheduled database maintenance and consolidation triggers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {CRON_JOBS.map(job => (
              <div key={job.name} className="p-3 border rounded-xl bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground font-mono">{job.name}</span>
                  <Badge variant="secondary" className="text-xxs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {job.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{job.description}</p>
                <div className="flex gap-4 pt-1 text-xxs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Schedule: {job.schedule}</span>
                  <span className="flex items-center gap-1"><Server className="h-3 w-3" /> Engine: Supabase DB</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure summary */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Server className="h-3.5 w-3.5" /> Engine: Postgres 17.6</span>
          <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> Cache: Dexie PWA Cache</span>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Bird, Wallet, Pill, TrendingUp } from 'lucide-react';
import { PrivacyMask } from '@/components/ui/PrivacyMask';

interface StatsOverviewProps {
  stats: {
    totalBirds: number;
    activeFlocks: number;
    pendingTasks: number;
    profit: number;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-primary/5 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Bird className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Birds</span>
          </div>
          <p className="text-2xl font-black">{stats.totalBirds.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{stats.activeFlocks} Active Flocks</p>
        </CardContent>
      </Card>

      <Card className="bg-green-500/5 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Profit</span>
          </div>
          <p className="text-2xl font-black text-green-600">
            GHS <PrivacyMask value={stats.profit.toLocaleString()} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Farm lifetime total</p>
        </CardContent>
      </Card>

      <Card className="bg-amber-500/5 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Pill className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Care</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.pendingTasks}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Health tasks this week</p>
        </CardContent>
      </Card>

      <Card className="bg-blue-500/5 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Wallet className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Balance</span>
          </div>
          <p className="text-2xl font-black text-blue-600">
            GHS <PrivacyMask value={stats.profit.toLocaleString()} />
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Available liquidity</p>
        </CardContent>
      </Card>
    </div>
  );
}

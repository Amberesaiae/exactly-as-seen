import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Layers, ClipboardList, Wallet, TrendingUp, Plus, Eye, EyeOff,
  AlertCircle, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type Activity = Database['public']['Tables']['activity_log']['Row'];

const sampleChartData = [
  { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 }, { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { costPrivacyEnabled, toggleCostPrivacy } = useAppStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [farmName, setFarmName] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: farms } = await supabase
        .from('farms')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (farms) {
        setFarmName(farms.name);

        const { data: batchData } = await supabase
          .from('batches')
          .select('*')
          .eq('farm_id', farms.id)
          .eq('status', 'active');
        if (batchData) setBatches(batchData);

        const { data: activityData } = await supabase
          .from('activity_log')
          .select('*')
          .eq('farm_id', farms.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (activityData) setActivities(activityData);
      }
    };

    loadData();
  }, [user]);

  const maskedValue = (value: string) => costPrivacyEnabled ? '* * * *' : value;

  const statCards = [
    { title: 'Active Batches', value: String(batches.length), icon: Layers, masked: false },
    { title: 'Tasks Today', value: '0', icon: ClipboardList, masked: false },
    { title: 'Weekly Expenses', value: maskedValue('GHS 0.00'), icon: Wallet, masked: true },
    { title: 'Monthly Revenue', value: maskedValue('GHS 0.00'), icon: TrendingUp, masked: true },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{farmName || 'Dashboard'}</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                {stat.masked && (
                  <button onClick={toggleCostPrivacy} className="text-muted-foreground hover:text-foreground transition-colors">
                    {costPrivacyEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Batches */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Active Batches</h2>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" asChild>
                <Link to="/batches"><Plus className="h-4 w-4" /> New Batch</Link>
              </Button>
            </div>

            {batches.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No active batches</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first batch to start tracking your flock.</p>
                  <Button className="gap-1.5 rounded-full" asChild>
                    <Link to="/batches"><Plus className="h-4 w-4" /> Create First Batch</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {batches.map((batch) => (
                  <Card key={batch.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{batch.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{batch.species}</p>
                        </div>
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success capitalize">
                          {batch.phase}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-3">
                        <div>
                          <p className="font-medium text-foreground">{batch.current_population}</p>
                          <p>Birds</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Wk {batch.current_week}</p>
                          <p>Day {batch.current_day}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">0</p>
                          <p>Tasks</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs">View</Button>
                        <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs">Mortality</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="production">Production</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">No data yet. Create a batch to see analytics.</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="expenses">
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={sampleChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="production">
                  <ResponsiveContainer width="100%" height={256}>
                    <LineChart data={sampleChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="performance">
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">Performance data requires at least one completed batch.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Activity Sidebar */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

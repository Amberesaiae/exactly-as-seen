import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { format } from 'date-fns';

const mortalityConfig = {
  cumulative: {
    label: 'Mortality',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

const causeConfig = {
  value: {
    label: 'Birds',
  },
} satisfies ChartConfig;

const COLORS = ['hsl(var(--destructive))', '#fbbf24', '#818cf8', '#34d399', '#8b5cf6'];

interface MortalityTabProps {
  mortalities: any[];
  chartData: any[];
  causeData: any[];
  totalMortality: number;
}

export function MortalityTab({ mortalities, chartData, causeData, totalMortality }: MortalityTabProps) {
  return (
    <div className="space-y-6">
      {totalMortality > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Cumulative Mortality ({totalMortality} total)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ChartContainer config={mortalityConfig}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-30" />
                      <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => (
                              <div className="flex flex-1 justify-between items-center leading-none gap-4">
                                <span className="text-muted-foreground">Mortality</span>
                                <span className="font-mono font-medium tabular-nums text-foreground">{value} birds</span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Line type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Cause of Mortality</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ChartContainer config={causeConfig}>
                    <PieChart>
                      <Pie
                        data={causeData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={70}
                        paddingAngle={5} dataKey="value"
                      >
                        {causeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mortalities.slice(0, 10).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{m.count} birds • <span className="capitalize">{m.cause.replace('_', ' ')}</span></p>
                      <p className="text-xs text-muted-foreground">{format(new Date(m.recorded_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground italic truncate max-w-[150px]">{m.notes}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Check className="h-10 w-10 text-green-500 mb-3" />
            <h3 className="font-semibold mb-1">No mortality recorded</h3>
            <p className="text-sm text-muted-foreground">This is a healthy flock! No bird deaths have been logged yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Check(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24"
      viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

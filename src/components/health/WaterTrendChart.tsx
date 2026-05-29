import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useAuth } from '@/contexts/AuthContext';

interface WaterTrendChartProps {
  data: any[];
  prescribedGallons?: number;
}

/**
 * Specialized component for Water Consumption Trends.
 * Visualizes Volume, Temperature, and Auto-calculated Cost.
 */
export function WaterTrendChart({ data, prescribedGallons = 0 }: WaterTrendChartProps) {
  const { currency } = useAuth();
  
  if (data.length < 2) return null;

  const chartConfig = {
    gallons: {
      label: 'Water (gal)',
      color: 'hsl(var(--primary))',
    },
    temp: {
      label: 'Temp (°C)',
      color: '#f59e0b',
    },
    cost: {
      label: `Cost (${currency})`,
      color: '#ef4444',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" /> Water Trend (14 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ChartContainer config={chartConfig}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex flex-1 justify-between items-center leading-none gap-4">
                        <span className="text-muted-foreground">
                          {name === 'gallons' ? 'Water' : name === 'cost' ? 'Cost' : 'Temp'}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {name === 'gallons' ? `${value} gal` : name === 'cost' ? `${currency} ${value}` : `${value}°C`}
                        </span>

                      </div>
                    )}
                  />
                }
              />
              <Line type="monotone" dataKey="gallons" stroke="var(--color-gallons)" strokeWidth={2} dot={{ r: 3 }} />
              {data.some(d => d.cost !== null) && (
                <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" strokeWidth={1.5} dot={{ r: 2 }} />
              )}
              {data.some(d => d.temp !== null) && (
                <Line type="monotone" dataKey="temp" stroke="var(--color-temp)" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
              )}
              {prescribedGallons > 0 && (
                <ReferenceLine y={prescribedGallons} stroke="#10b981" strokeDasharray="6 3" label={{ value: 'Guideline', position: 'right', fontSize: 10, fill: '#10b981' }} />
              )}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

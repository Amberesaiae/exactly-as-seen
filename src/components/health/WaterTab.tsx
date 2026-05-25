import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplets, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface WaterTabProps {
  batch: any;
  waterRecords: any[];
  waterChartData: any[];
  waterGuideline: number;
  waterSaving: boolean;
  onLogWater: (gallons: number, temp?: number | null, notes?: string) => void;
}

import { useState } from 'react';

export function WaterTab({
  batch,
  waterRecords,
  waterChartData,
  waterGuideline,
  waterSaving,
  onLogWater,
}: WaterTabProps) {
  const [waterGallons, setWaterGallons] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [waterNotes, setWaterNotes] = useState('');

  const handleSubmit = () => {
    const gallons = parseFloat(waterGallons);
    if (!gallons || gallons <= 0) return;
    const temp = waterTemp ? parseFloat(waterTemp) : null;
    onLogWater(gallons, temp, waterNotes);
    setWaterGallons('');
    setWaterTemp('');
    setWaterNotes('');
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Log Water Consumption</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Gallons Consumed</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={waterGallons}
                onChange={e => setWaterGallons(e.target.value)}
                placeholder="e.g., 15"
              />
            </div>
            <div className="space-y-1">
              <Label>Temperature °C</Label>
              <Input
                type="number"
                value={waterTemp}
                onChange={e => setWaterTemp(e.target.value)}
                placeholder="e.g., 28"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input value={waterNotes} onChange={e => setWaterNotes(e.target.value)} placeholder="e.g., Added electrolytes" />
          </div>
          {batch && (
            <p className="text-xs text-muted-foreground">
              Guideline: ~{waterGuideline} gallons/day ({batch.current_population} birds × ~¼ cup each)
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!waterGallons || waterSaving}
            className="rounded-full gap-1.5"
          >
            {waterSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Droplets className="h-4 w-4" /> Log Water</>}
          </Button>
        </CardContent>
      </Card>

      {/* Water consumption chart */}
      {waterChartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Water Trend (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waterChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number, name: string) => [
                      name === 'gallons' ? `${value} gal` : `${value}°C`,
                      name === 'gallons' ? 'Water' : 'Temp',
                    ]}
                  />
                  <Line type="monotone" dataKey="gallons" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  {waterChartData.some(d => d.temp !== null) && (
                    <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                  )}
                  {waterGuideline > 0 && (
                    <ReferenceLine y={waterGuideline} stroke="#10b981" strokeDasharray="6 3" label={{ value: 'Guideline', position: 'right', fontSize: 10, fill: '#10b981' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Water history */}
      {waterRecords.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Water Log</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {waterRecords.map(w => {
                const isHighTemp = w.temperature_c && Number(w.temperature_c) > 32;
                return (
                  <div key={w.id} className={`flex items-center justify-between text-sm border-b pb-1.5 last:border-0 ${isHighTemp ? 'bg-orange-50 rounded px-1' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{format(new Date(w.date), 'MMM d')}</span>
                      {w.notes && <span className="text-xs text-muted-foreground truncate max-w-[120px]">— {w.notes}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{w.gallons_consumed} gal</span>
                      {w.temperature_c && (
                        <span className={`text-xs ${isHighTemp ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                          {isHighTemp && '🔥 '}{w.temperature_c}°C
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

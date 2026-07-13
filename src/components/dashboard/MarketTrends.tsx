import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { selectPrimaryFarm } from '@/lib/canonical';

type PriceRow = { key: string; label: string; value: string };

const KEY_LABELS: Record<string, string> = {
  broiler_live: 'Broiler (Live)',
  broiler_price: 'Broiler (Live)',
  large_egg_crate: 'Large Eggs (Crate)',
  egg_crate_large: 'Large Eggs (Crate)',
  maize_50kg: 'Maize (50kg)',
  maize: 'Maize (50kg)',
};

/**
 * Market prices from farm config_overrides — never hardcode demo numbers.
 * Farmer sets values under Settings → Prices.
 */
export function MarketTrends() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: farms } = await supabase
        .from('farms')
        .select('id, setup_complete, updated_at')
        .eq('user_id', user.id);
      const farm = selectPrimaryFarm(farms);
      if (!farm || cancelled) {
        setLoading(false);
        return;
      }

      const { data: overrides, error } = await supabase
        .from('config_overrides')
        .select('key, value')
        .eq('farm_id', farm.id)
        .limit(20);

      if (!error && overrides?.length) {
        const mapped: PriceRow[] = overrides
          .filter((o) => /price|egg|broiler|maize|market/i.test(o.key))
          .slice(0, 6)
          .map((o) => ({
            key: o.key,
            label: KEY_LABELS[o.key] || o.key.replace(/_/g, ' '),
            value: String(o.value),
          }));
        if (!cancelled) setRows(mapped);
      } else {
        if (!cancelled) setRows([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Market Prices (GHS)
      </h2>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading farm prices…</p>
      ) : rows.length === 0 ? (
        <Card className="border-dashed border-muted shadow-none">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              No market prices saved for this farm. Set broiler, egg, and feed prices in Settings so estimates and sales stay honest — no demo figures.
            </p>
            <Button asChild size="sm" variant="outline" className="rounded-full shrink-0 gap-1.5">
              <Link to="/settings">
                <Settings2 className="h-3.5 w-3.5" /> Open Prices
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rows.map((row) => (
            <Card key={row.key} className="border-none bg-muted/30 shadow-none">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.label}</span>
                  <Badge className="text-[8px] h-4 py-0 border-none bg-primary/10 text-primary">Farm</Badge>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-sm font-black">GHS {row.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

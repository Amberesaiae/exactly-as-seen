import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Target, Calendar, Weight, Info as InfoIcon } from 'lucide-react';

const SPECIES_CONFIGS = [
  {
    id: 'broiler',
    name: 'Broiler',
    type: 'Meat Production',
    cycleWeeks: '8 Weeks (Fixed)',
    targetWeight: '2.2 - 2.5 kg',
    feedPhase: 'Starter (Wk 1-3) -> Grower (Wk 4-6) -> Finisher (Wk 7-8)',
    desc: 'Bred specifically for meat production. Rapid growth and high feed conversion ratio.',
  },
  {
    id: 'layer',
    name: 'Layer',
    type: 'Egg Production',
    cycleWeeks: '72 - 78 Weeks (Slider)',
    targetWeight: '1.8 - 2.0 kg',
    feedPhase: 'Chick Starter (Wk 1-8) -> Grower (Wk 9-18) -> Layer (Wk 19-78)',
    desc: 'Optimized for commercial egg production. Begins egg laying at Week 19-20.',
  },
  {
    id: 'duck_meat',
    name: 'Duck (Meat)',
    type: 'Meat Production',
    cycleWeeks: '8 - 10 Weeks (Fixed)',
    targetWeight: '3.0 - 3.2 kg',
    feedPhase: 'Starter (Wk 1-3) -> Grower (Wk 4-10)',
    desc: 'Meat-centric duck breeds (Pekin etc.). Rapid meat development with zero egg records.',
  },
  {
    id: 'duck_layer',
    name: 'Duck (Layer)',
    type: 'Egg Production',
    cycleWeeks: '72+ Weeks (Slider)',
    targetWeight: '1.6 - 1.8 kg',
    feedPhase: 'Starter (Wk 1-3) -> Grower (Wk 4-19) -> Layer (Wk 20+)',
    desc: 'Egg-producing duck breeds (Khaki Campbell). Lays premium large duck eggs from Week 20.',
  },
  {
    id: 'turkey',
    name: 'Turkey',
    type: 'Meat Production',
    cycleWeeks: '12 - 20 Weeks (Slider)',
    targetWeight: '8.0 - 12.0 kg',
    feedPhase: 'Pre-Starter -> Starter -> Grower -> Finisher',
    desc: 'Excellent meat yield. Extends up to 20 weeks for heavy tom breeds.',
  },
];

export default function SpeciesConfigTab() {
  return (
    <div className="space-y-4 mt-4">
      {/* Information Alert */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex gap-3 items-start">
          <InfoIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-primary">Species Standard Benchmarks (L1 Baseline)</p>
            <p className="text-xs text-muted-foreground">
              These baselines define the immutable biological bounds of the system (cycle durations, expected laying phases, and target growth).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cards for each species */}
      <div className="space-y-3">
        {SPECIES_CONFIGS.map(s => (
          <Card key={s.id} className="overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-primary/5">
              <div>
                <CardTitle className="text-base flex items-center gap-1.5">
                  {s.name}
                  <Badge variant="outline" className="text-xxs px-1.5 py-0.5">
                    {s.type}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">{s.desc}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xxs text-muted-foreground uppercase tracking-wider font-semibold">Standard Cycle</p>
                    <p className="text-xs font-medium text-foreground">{s.cycleWeeks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xxs text-muted-foreground uppercase tracking-wider font-semibold">Target Weight</p>
                    <p className="text-xs font-medium text-foreground">{s.targetWeight}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-dashed">
                <Target className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xxs text-muted-foreground uppercase tracking-wider font-semibold">Feed Progression Phases</p>
                  <p className="text-xs text-foreground font-mono">{s.feedPhase}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

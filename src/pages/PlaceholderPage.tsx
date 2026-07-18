import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/batches': 'Batch Management',
  '/feed': 'Feed Calculator',
  '/health': 'Water & Health',
  '/eggs': 'Egg Production',
  '/finance': 'Finance',
  '/stock': 'Stock Management',
  '/records': 'Records',
  '/settings': 'Settings',
};

export default function PlaceholderPage() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Page';

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            The {title.toLowerCase()} module is under development. Check back soon for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

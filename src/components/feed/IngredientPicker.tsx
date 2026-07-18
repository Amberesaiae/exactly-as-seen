import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Ingredient } from '@/lib/feed-data';

interface IngredientPickerProps {
  open: boolean;
  onClose: () => void;
  category: 'energy' | 'protein' | 'calcium' | 'supplement';
  ingredients: Ingredient[];
  species: string;
  alreadySelected: string[];
  singleSelect?: boolean; // for calcium
  onSelect: (ingredient: Ingredient, quantityKg: number, unitPrice: number, stockItemId?: string) => void;
  stockItems?: any[];
}

const categoryTitles: Record<string, string> = {
  energy: 'Energy Source',
  protein: 'Protein Source',
  calcium: 'Calcium Source',
  supplement: 'Supplement',
};

export function IngredientPicker({ open, onClose, category, ingredients, species, alreadySelected, singleSelect, onSelect, stockItems = [] }: IngredientPickerProps) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [quantityKg, setQuantityKg] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const available = ingredients.filter(i => i.category === category && !alreadySelected.includes(i.name));

  // Block cotton seed for layers
  const isBlocked = (ing: Ingredient) => {
    if (species === 'layer' && ing.name.toLowerCase().includes('cotton')) return true;
    return false;
  };

  const handleSelect = (ing: Ingredient) => {
    setSelectedIng(ing);
    setUnitPrice(ing.defaultPricePerKg.toString());
    setQuantityKg('');
  };

  const handleConfirm = () => {
    if (!selectedIng) return;
    const qty = parseFloat(quantityKg) || 0;
    const price = parseFloat(unitPrice) || selectedIng.defaultPricePerKg;
    const stockItem = stockItems.find(si => si.name.toLowerCase() === selectedIng.name.toLowerCase());
    
    onSelect(selectedIng, qty, price, stockItem?.id);
    setSelectedIng(null);
    setQuantityKg('');
    setUnitPrice('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {categoryTitles[category]}</DialogTitle>
          <DialogDescription>
            {singleSelect ? 'Only one calcium source allowed — selecting replaces any existing one.' : `Choose from available ${category} sources.`}
          </DialogDescription>
        </DialogHeader>

        {!selectedIng ? (
          <div className="space-y-2">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">All {category} sources already selected</p>
            ) : (
              available.map(ing => {
                const blocked = isBlocked(ing);
                return (
                  <div key={ing.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-semibold text-sm">{ing.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          CP: {ing.proteinPct}% · E: {ing.energyKcal} kcal
                        </p>
                        {stockItems.find(si => si.name.toLowerCase() === ing.name.toLowerCase()) && (
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-primary/5 text-primary border-primary/20">
                            {stockItems.find(si => si.name.toLowerCase() === ing.name.toLowerCase()).current_quantity} kg in stock
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Default price: GH₵{ing.defaultPricePerKg}/kg</p>
                    </div>
                    {blocked ? (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    ) : (
                      <Button size="sm" className="rounded-full" onClick={() => handleSelect(ing)}>Select</Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">{selectedIng.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                CP: {selectedIng.proteinPct}% · Energy: {selectedIng.energyKcal} kcal/kg · Calcium: {selectedIng.calciumPct}%
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quantity (kg)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={quantityKg}
                  onChange={e => setQuantityKg(e.target.value)}
                  placeholder="e.g. 250"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price per kg (GH₵)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => setSelectedIng(null)}>Back</Button>
              <Button className="rounded-full" onClick={handleConfirm}>Add Ingredient</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

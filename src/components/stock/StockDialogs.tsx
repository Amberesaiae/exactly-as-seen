import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];

interface StockDialogsProps {
  itemDialogOpen: boolean;
  setItemDialogOpen: (open: boolean) => void;
  txDialogOpen: boolean;
  setTxDialogOpen: (open: boolean) => void;
  selectedItemId: string | null;
  txType: 'purchase' | 'usage' | 'adjustment' | null;
  stockItems: StockItem[];
  onAddItem: (data: Partial<StockItem>) => Promise<void>;
  onRecordTx: (itemId: string, type: 'purchase' | 'usage' | 'adjustment', qty: number, price?: number, notes?: string) => Promise<void>;
  submitting: boolean;
  costPrivacyEnabled: boolean;
}

export function StockDialogs({
  itemDialogOpen, setItemDialogOpen,
  txDialogOpen, setTxDialogOpen,
  selectedItemId, txType, stockItems,
  onAddItem, onRecordTx,
  submitting, costPrivacyEnabled
}: StockDialogsProps) {
  const [newItem, setNewItem] = useState({ name: '', category: 'feed', unit: 'kg', current_quantity: '0', reorder_threshold: '10', unit_price: '0' });
  const [txData, setTxData] = useState({ qty: '', price: '', notes: '' });

  const selectedItem = stockItems.find(i => i.id === selectedItemId);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddItem({
      ...newItem,
      current_quantity: parseFloat(newItem.current_quantity),
      reorder_threshold: parseFloat(newItem.reorder_threshold),
      unit_price: parseFloat(newItem.unit_price)
    });
    setItemDialogOpen(false);
    setNewItem({ name: '', category: 'feed', unit: 'kg', current_quantity: '0', reorder_threshold: '10', unit_price: '0' });
  };

  const handleRecordTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !txType) return;
    await onRecordTx(
      selectedItemId,
      txType,
      parseFloat(txData.qty),
      txData.price ? parseFloat(txData.price) : undefined,
      txData.notes
    );
    setTxDialogOpen(false);
    setTxData({ qty: '', price: '', notes: '' });
  };

  return (
    <>
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleAddItem}>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Create a new inventory item to track.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Starter Feed" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed">Feed</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} placeholder="kg, bags, etc." required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Initial Qty</Label>
                  <Input id="qty" type="number" value={newItem.current_quantity} onChange={e => setNewItem({...newItem, current_quantity: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min">Min Level</Label>
                  <Input id="min" type="number" value={newItem.reorder_threshold} onChange={e => setNewItem({...newItem, reorder_threshold: e.target.value})} required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full rounded-full">
                {submitting ? 'Creating...' : 'Add Inventory Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleRecordTx}>
            <DialogHeader>
              <DialogTitle className="capitalize">{txType} {selectedItem?.name}</DialogTitle>
              <DialogDescription>Enter details for this stock {txType}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tx-qty">Quantity ({selectedItem?.unit})</Label>
                  <Input id="tx-qty" type="number" value={txData.qty} onChange={e => setTxData({...txData, qty: e.target.value})} required />
                </div>
                {txType === 'purchase' && (
                  <div className="space-y-2">
                    <Label htmlFor="tx-price">Unit Price (GHS)</Label>
                    <Input id="tx-price" type="number" step="0.01" value={txData.price} onChange={e => setTxData({...txData, price: e.target.value})} required />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-notes">Notes</Label>
                <Textarea id="tx-notes" value={txData.notes} onChange={e => setTxData({...txData, notes: e.target.value})} placeholder="Optional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full rounded-full">
                {submitting ? 'Processing...' : `Record ${txType}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

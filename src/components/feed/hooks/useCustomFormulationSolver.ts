import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { type FeedPhase, normalizeIngredient, type Ingredient } from '@/lib/feed-data';
import { preprocessFormulation } from '@/lib/feed-safety';
import { solveFeedLP, type InfeasibilityAdvice } from '@/lib/feed-lp';

interface SelectedIngredient {
  ingredient: Ingredient;
  quantityKg: number;
  unitPrice: number;
  autoAdded?: boolean;
  stockItemId?: string;
  stockQty?: number;
}

export const useCustomFormulationSolver = (
  batch: any, 
  phase: FeedPhase | undefined, 
  totalKg: number
) => {
  const [selected, setSelected] = useState<SelectedIngredient[]>([]);
  const [dbIngredients, setDbIngredients] = useState<any[]>([]);
  const [dbRequirements, setDbRequirements] = useState<any | null>(null);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [solverStatus, setSolverStatus] = useState<'optimal' | 'fallback' | 'manual'>('manual');
  const [fallbackReason, setFallbackReason] = useState<string | undefined>(undefined);
  const [solverAdvice, setSolverAdvice] = useState<InfeasibilityAdvice[]>([]);

  // Load database tables
  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
      const { data: ingData } = await supabase.from('ingredients').select('*');
      const { data: sData } = await supabase.from('stock_items').select('*');
      const { isFeedStockCategory } = await import('@/lib/stock-match');
      const feedStock = (sData ?? []).filter((s: { category: string }) => isFeedStockCategory(s.category));

      setDbIngredients(ingData ?? []);
      setStockItems(feedStock);

      let reqQuery = supabase.from('nutritional_requirements')
        .select('*')
        .eq('species', batch.species)
        .eq('phase', phase?.name.toLowerCase() ?? 'starter');

      if (batch.species === 'duck' && batch.duck_type) {
        reqQuery = reqQuery.eq('duck_type', batch.duck_type);
      } else {
        reqQuery = reqQuery.is('duck_type', null);
      }

      const { data: reqData } = await reqQuery.maybeSingle();
      setDbRequirements(reqData || {
        protein_min: phase?.proteinPct ?? 18,
        energy_min: phase?.energyKcal ?? 3000,
        energy_max: (phase?.energyKcal ?? 3000) + 200,
        calcium_min: phase?.calciumPct ?? 0.9,
        calcium_max: (phase?.calciumPct ?? 0.9) + 0.2,
        phosphorus_min: 0.4,
        lysine_min: 0.9,
        methionine_min: 0.4,
      });
      setDbLoading(false);
    };
    load();
  }, [batch.species, batch.duck_type, phase]);

  // Derived nutrition state
  const nutrition = useMemo(() => {
    const usedKg = selected.reduce((sum, s) => sum + s.quantityKg, 0);
    if (usedKg === 0) return { protein: 0, energy: 0, calcium: 0 };
    return {
      protein: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.proteinPct, 0),
      energy: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.energyKcal, 0),
      calcium: selected.reduce((sum, s) => sum + (s.quantityKg / usedKg) * s.ingredient.calciumPct, 0),
    };
  }, [selected]);

  // Preprocessor logic
  const preprocessData = useMemo(() => {
    if (dbIngredients.length === 0) return { warnings: [], blocked: false, selected: [], blockedReason: undefined, suggestions: [] };
    return preprocessFormulation({
      species: batch.species,
      targetKg: totalKg,
      selected: selected.map(s => ({
        ingredient: normalizeIngredient(s.ingredient),
        quantityKg: s.quantityKg,
        unitPrice: s.unitPrice,
        autoAdded: s.autoAdded,
      })),
      availableIngredients: dbIngredients.map((i) => normalizeIngredient(i)),
    });
  }, [selected, totalKg, dbIngredients, batch.species]);

  const handleOptimize = async () => {
    if (!phase || !dbRequirements) { toast.error('Requirements loading...'); return; }
    if (selected.length === 0) { toast.error('Select at least one ingredient'); return; }

    if (preprocessData.blocked) {
      toast.error(`Pre-flight safety block: ${preprocessData.blockedReason}`);
      return;
    }

    setOptimizing(true);
    try {
      const lpResult = await solveFeedLP({
        species: batch.species,
        targetKg: totalKg,
        selected: selected.map(s => ({
           ingredient: normalizeIngredient(s.ingredient),
           quantityKg: s.quantityKg,
           unitPrice: s.unitPrice
        })),
        requirements: dbRequirements,
      });

      setSelected(prev => prev.map(s => ({
        ...s,
        quantityKg: lpResult.quantities[s.ingredient.id] || 0,
      })));

      if (lpResult.status === 'optimal') {
        setOptimized(true);
        setSolverStatus('optimal');
        setSolverAdvice([]);
        toast.success('Cost minimized while meeting all nutritional requirements!');
      } else {
        setSolverStatus('fallback');
        setFallbackReason(lpResult.fallbackReason);
        setSolverAdvice(lpResult.advice || []);
        toast.warning('Linear solver failed to find optimal recipe. Flexible Mix applied.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Optimization failed unexpectedly');
    } finally {
    setOptimizing(false);
    }
    };

    const saveAsRecipe = async (name: string, description?: string) => {
    const { data: profile } = await supabase.auth.getUser();
    if (!profile.user) return;

    const { data: farm } = await supabase.from('farms').select('id').eq('user_id', profile.user.id).limit(1).single();
    if (!farm) return;

    const { error } = await supabase.from('feed_recipes').insert({
    farm_id: farm.id,
    name,
    description,
    species: batch.species,
    ingredients: selected.map(s => ({
      name: s.ingredient.name,
      quantity_kg: s.quantityKg,
      unit_price: s.unitPrice,
      category: s.ingredient.category
    })),
    nutritional_profile: nutrition
    } as any);

    if (error) { toast.error(error.message); return; }
    toast.success('Recipe saved to library!');
    };

    return {
    selected,
    setSelected,
    dbIngredients,
    dbRequirements,
    stockItems,
    dbLoading,
    nutrition,
    preprocessData,
    optimizing,
    optimized,
    setOptimized,
    solverStatus,
    setSolverStatus,
    fallbackReason,
    solverAdvice,
    handleOptimize,
    saveAsRecipe,
    };
    };


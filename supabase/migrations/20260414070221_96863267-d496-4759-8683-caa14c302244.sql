
-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_farms_updated_at ON public.farms;
DROP TRIGGER IF EXISTS update_houses_updated_at ON public.houses;
DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate all updated_at triggers
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON public.houses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- mortality_records
CREATE TABLE IF NOT EXISTS public.mortality_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 1,
  cause TEXT,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.mortality_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mortality records" ON public.mortality_records FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = mortality_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own mortality records" ON public.mortality_records FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = mortality_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own mortality records" ON public.mortality_records FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = mortality_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own mortality records" ON public.mortality_records FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = mortality_records.farm_id AND farms.user_id = auth.uid()));

-- batch_tasks
CREATE TABLE IF NOT EXISTS public.batch_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.batch_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own batch tasks" ON public.batch_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = batch_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own batch tasks" ON public.batch_tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = batch_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own batch tasks" ON public.batch_tasks FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = batch_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own batch tasks" ON public.batch_tasks FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = batch_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE TRIGGER update_batch_tasks_updated_at BEFORE UPDATE ON public.batch_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- feed_formulations
CREATE TABLE IF NOT EXISTS public.feed_formulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  species TEXT NOT NULL DEFAULT 'broiler',
  phase TEXT NOT NULL DEFAULT 'starter',
  population INTEGER NOT NULL DEFAULT 0,
  bags_count INTEGER NOT NULL DEFAULT 1,
  bag_size_kg NUMERIC NOT NULL DEFAULT 50,
  total_kg NUMERIC NOT NULL DEFAULT 50,
  formulation_type TEXT NOT NULL DEFAULT 'quick',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_formulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feed formulations" ON public.feed_formulations FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_formulations.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own feed formulations" ON public.feed_formulations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_formulations.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own feed formulations" ON public.feed_formulations FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_formulations.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own feed formulations" ON public.feed_formulations FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_formulations.farm_id AND farms.user_id = auth.uid()));

-- feed_ingredients
CREATE TABLE IF NOT EXISTS public.feed_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulation_id UUID NOT NULL REFERENCES public.feed_formulations(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'energy',
  name TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.feed_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feed ingredients" ON public.feed_ingredients FOR SELECT USING (EXISTS (SELECT 1 FROM feed_formulations ff JOIN farms f ON f.id = ff.farm_id WHERE ff.id = feed_ingredients.formulation_id AND f.user_id = auth.uid()));
CREATE POLICY "Users can insert own feed ingredients" ON public.feed_ingredients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM feed_formulations ff JOIN farms f ON f.id = ff.farm_id WHERE ff.id = feed_ingredients.formulation_id AND f.user_id = auth.uid()));
CREATE POLICY "Users can update own feed ingredients" ON public.feed_ingredients FOR UPDATE USING (EXISTS (SELECT 1 FROM feed_formulations ff JOIN farms f ON f.id = ff.farm_id WHERE ff.id = feed_ingredients.formulation_id AND f.user_id = auth.uid()));
CREATE POLICY "Users can delete own feed ingredients" ON public.feed_ingredients FOR DELETE USING (EXISTS (SELECT 1 FROM feed_formulations ff JOIN farms f ON f.id = ff.farm_id WHERE ff.id = feed_ingredients.formulation_id AND f.user_id = auth.uid()));

-- feed_schedules
CREATE TABLE IF NOT EXISTS public.feed_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  week INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  amount_per_bird_g NUMERIC NOT NULL DEFAULT 0,
  total_amount_kg NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feed schedules" ON public.feed_schedules FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_schedules.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own feed schedules" ON public.feed_schedules FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_schedules.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own feed schedules" ON public.feed_schedules FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_schedules.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own feed schedules" ON public.feed_schedules FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = feed_schedules.farm_id AND farms.user_id = auth.uid()));

-- health_tasks
CREATE TABLE IF NOT EXISTS public.health_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'medication',
  product_name TEXT NOT NULL,
  dose_per_gallon NUMERIC,
  duration_days INTEGER NOT NULL DEFAULT 1,
  withdrawal_meat_days INTEGER NOT NULL DEFAULT 0,
  withdrawal_egg_days INTEGER NOT NULL DEFAULT 0,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.health_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own health tasks" ON public.health_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = health_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own health tasks" ON public.health_tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = health_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own health tasks" ON public.health_tasks FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = health_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own health tasks" ON public.health_tasks FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = health_tasks.farm_id AND farms.user_id = auth.uid()));
CREATE TRIGGER update_health_tasks_updated_at BEFORE UPDATE ON public.health_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- water_records
CREATE TABLE IF NOT EXISTS public.water_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  gallons_consumed NUMERIC NOT NULL DEFAULT 0,
  temperature_c NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.water_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own water records" ON public.water_records FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = water_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own water records" ON public.water_records FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = water_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own water records" ON public.water_records FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = water_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own water records" ON public.water_records FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = water_records.farm_id AND farms.user_id = auth.uid()));

-- vaccination_schedule
CREATE TABLE IF NOT EXISTS public.vaccination_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  scheduled_week INTEGER NOT NULL DEFAULT 1,
  scheduled_date DATE NOT NULL,
  administered BOOLEAN NOT NULL DEFAULT false,
  administered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.vaccination_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vaccination schedule" ON public.vaccination_schedule FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = vaccination_schedule.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own vaccination schedule" ON public.vaccination_schedule FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = vaccination_schedule.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own vaccination schedule" ON public.vaccination_schedule FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = vaccination_schedule.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own vaccination schedule" ON public.vaccination_schedule FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = vaccination_schedule.farm_id AND farms.user_id = auth.uid()));

-- egg_records
CREATE TABLE IF NOT EXISTS public.egg_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_eggs INTEGER NOT NULL DEFAULT 0,
  broken INTEGER NOT NULL DEFAULT 0,
  dirty INTEGER NOT NULL DEFAULT 0,
  good INTEGER NOT NULL DEFAULT 0,
  size_category TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.egg_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own egg records" ON public.egg_records FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own egg records" ON public.egg_records FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own egg records" ON public.egg_records FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_records.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own egg records" ON public.egg_records FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_records.farm_id AND farms.user_id = auth.uid()));

-- egg_sales
CREATE TABLE IF NOT EXISTS public.egg_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL DEFAULT 0,
  size_category TEXT NOT NULL DEFAULT 'medium',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  buyer TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.egg_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own egg sales" ON public.egg_sales FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_sales.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own egg sales" ON public.egg_sales FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_sales.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own egg sales" ON public.egg_sales FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_sales.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own egg sales" ON public.egg_sales FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = egg_sales.farm_id AND farms.user_id = auth.uid()));

-- expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual',
  source_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = expenses.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = expenses.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = expenses.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = expenses.farm_id AND farms.user_id = auth.uid()));

-- revenue
CREATE TABLE IF NOT EXISTS public.revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  buyer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own revenue" ON public.revenue FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = revenue.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own revenue" ON public.revenue FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = revenue.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own revenue" ON public.revenue FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = revenue.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own revenue" ON public.revenue FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = revenue.farm_id AND farms.user_id = auth.uid()));

-- stock_items
CREATE TABLE IF NOT EXISTS public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'feed_ingredients',
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  current_quantity NUMERIC NOT NULL DEFAULT 0,
  reorder_threshold NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stock items" ON public.stock_items FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_items.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own stock items" ON public.stock_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_items.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own stock items" ON public.stock_items FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_items.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own stock items" ON public.stock_items FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_items.farm_id AND farms.user_id = auth.uid()));
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- stock_transactions
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'purchase',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  source_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stock transactions" ON public.stock_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_transactions.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can insert own stock transactions" ON public.stock_transactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_transactions.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can update own stock transactions" ON public.stock_transactions FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_transactions.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Users can delete own stock transactions" ON public.stock_transactions FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_transactions.farm_id AND farms.user_id = auth.uid()));

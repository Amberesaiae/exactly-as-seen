
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create farms table
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_region TEXT,
  location_district TEXT,
  farm_type TEXT NOT NULL DEFAULT 'poultry',
  setup_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own farms" ON public.farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farms" ON public.farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own farms" ON public.farms FOR DELETE USING (auth.uid() = user_id);

-- Create houses table
CREATE TABLE public.houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own houses" ON public.houses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = houses.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert own houses" ON public.houses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = houses.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update own houses" ON public.houses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = houses.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete own houses" ON public.houses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = houses.farm_id AND farms.user_id = auth.uid())
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_privacy_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'light',
  currency TEXT NOT NULL DEFAULT 'GHS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'broiler',
  production_system TEXT NOT NULL DEFAULT 'deep_litter',
  status TEXT NOT NULL DEFAULT 'active',
  initial_quantity INTEGER NOT NULL DEFAULT 0,
  current_population INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_week INTEGER NOT NULL DEFAULT 1,
  current_day INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'starter',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own batches" ON public.batches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = batches.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert own batches" ON public.batches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = batches.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update own batches" ON public.batches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = batches.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can delete own batches" ON public.batches FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = batches.farm_id AND farms.user_id = auth.uid())
);

-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = activity_log.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert own activity" ON public.activity_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farms WHERE farms.id = activity_log.farm_id AND farms.user_id = auth.uid())
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON public.houses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

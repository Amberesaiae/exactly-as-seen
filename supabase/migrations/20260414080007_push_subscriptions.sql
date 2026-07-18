-- Migration 11: Create push_subscriptions table for push notifications
BEGIN;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own subscription" ON public.push_subscriptions FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can insert own subscription" ON public.push_subscriptions FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update own subscription" ON public.push_subscriptions FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can delete own subscription" ON public.push_subscriptions FOR DELETE USING (
  auth.uid() = user_id
);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

CREATE TABLE IF NOT EXISTS public.connecteurs_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connecteur_id TEXT NOT NULL,
  credentials JSONB DEFAULT '{}' NOT NULL,
  actif BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connecteur_id)
);

ALTER TABLE public.connecteurs_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own connecteurs"
  ON public.connecteurs_config
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_connecteurs_config_user ON public.connecteurs_config(user_id);
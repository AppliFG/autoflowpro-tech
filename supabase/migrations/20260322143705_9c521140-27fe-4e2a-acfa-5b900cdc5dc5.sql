ALTER TABLE public.connecteurs_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own connecteurs" ON public.connecteurs_config;
DROP POLICY IF EXISTS "Users manage own connecteurs" ON public.connecteurs_config;

CREATE POLICY "Users manage own connecteurs"
ON public.connecteurs_config
FOR ALL
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
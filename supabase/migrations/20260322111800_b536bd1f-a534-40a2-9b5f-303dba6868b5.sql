ALTER TABLE public.connecteurs_config ADD COLUMN IF NOT EXISTS connecte BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_connecteurs_user_id ON public.connecteurs_config(user_id, connecteur_id);

CREATE OR REPLACE FUNCTION update_connecteurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_connecteurs_updated ON public.connecteurs_config;
CREATE TRIGGER tr_connecteurs_updated
  BEFORE UPDATE ON public.connecteurs_config
  FOR EACH ROW
  EXECUTE FUNCTION update_connecteurs_updated_at();
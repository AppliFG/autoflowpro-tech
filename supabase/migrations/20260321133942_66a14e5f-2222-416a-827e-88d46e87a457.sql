
-- Create connector_credentials table for storing encrypted credentials per user
CREATE TABLE public.connector_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  encrypted_credentials text, -- encrypted JSON blob
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, connector_id)
);

-- Enable RLS
ALTER TABLE public.connector_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only see their own credentials
CREATE POLICY "Users can read own credentials"
ON public.connector_credentials FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
ON public.connector_credentials FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
ON public.connector_credentials FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
ON public.connector_credentials FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_connector_credentials_updated_at
  BEFORE UPDATE ON public.connector_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

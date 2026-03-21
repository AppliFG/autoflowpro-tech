-- Sessions de conversation Telegram (workflow multi-étapes)
CREATE TABLE public.telegram_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  etape TEXT NOT NULL DEFAULT 'idle',
  data_json JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_sessions_chat_id ON public.telegram_sessions(chat_id);

ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage telegram_sessions"
  ON public.telegram_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read telegram_sessions"
  ON public.telegram_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Administrateurs Telegram autorisés
CREATE TABLE public.telegram_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  user_id UUID,
  nom TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.telegram_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read telegram_admins"
  ON public.telegram_admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage telegram_admins"
  ON public.telegram_admins FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Service role can manage telegram_admins"
  ON public.telegram_admins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Demandes de devis pièces via Telegram
CREATE TABLE public.demandes_devis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID,
  immatriculation TEXT,
  marque TEXT,
  modele TEXT,
  annee INTEGER,
  pieces_demandees TEXT NOT NULL,
  chat_id BIGINT,
  statut TEXT DEFAULT 'en_attente',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demandes_devis_statut ON public.demandes_devis(statut);

ALTER TABLE public.demandes_devis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read demandes_devis"
  ON public.demandes_devis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert demandes_devis"
  ON public.demandes_devis FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update demandes_devis"
  ON public.demandes_devis FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete demandes_devis"
  ON public.demandes_devis FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage demandes_devis"
  ON public.demandes_devis FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
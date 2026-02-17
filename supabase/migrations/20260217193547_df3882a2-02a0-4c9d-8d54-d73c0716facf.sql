
-- Add police_number to vehicles
ALTER TABLE public.vehicles ADD COLUMN police_number integer;

-- Create a unique index to prevent duplicates
CREATE UNIQUE INDEX idx_vehicles_police_number ON public.vehicles (police_number) WHERE police_number IS NOT NULL;

-- Settings table for configurable values like starting police number
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default starting police number
INSERT INTO public.app_settings (key, value) VALUES ('police_number_start', '1');

-- RGPD: Add consent tracking to trade_ins
ALTER TABLE public.trade_ins ADD COLUMN rgpd_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.trade_ins ADD COLUMN rgpd_consent_date timestamp with time zone;

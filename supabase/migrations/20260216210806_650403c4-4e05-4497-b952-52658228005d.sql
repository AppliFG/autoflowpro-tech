
-- Table des fournisseurs
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des véhicules
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  year INTEGER,
  fuel_type TEXT,
  mileage INTEGER,
  color TEXT,
  purchase_price NUMERIC(10,2) DEFAULT 0,
  selling_price NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'En stock',
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des travaux par véhicule
CREATE TABLE public.vehicle_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des demandes de devis
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Brouillon',
  total_amount NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Articles d'un devis
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  article_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Demandes de reprise (publiques)
CREATE TABLE public.trade_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  registration TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  desired_amount NUMERIC(10,2),
  photo_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Nouvelle',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_ins ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users have full access
CREATE POLICY "Authenticated full access" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.vehicle_works FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.quote_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON public.trade_ins FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public: anyone can view vehicles (vitrine)
CREATE POLICY "Public can view vehicles" ON public.vehicles FOR SELECT TO anon USING (true);

-- Public: anyone can submit a trade-in request
CREATE POLICY "Public can submit trade-ins" ON public.trade_ins FOR INSERT TO anon WITH CHECK (true);

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trade_ins_updated_at BEFORE UPDATE ON public.trade_ins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true);

CREATE POLICY "Public can view vehicle photos" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-photos');
CREATE POLICY "Authenticated can upload vehicle photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-photos');
CREATE POLICY "Authenticated can update vehicle photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-photos');
CREATE POLICY "Authenticated can delete vehicle photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-photos');

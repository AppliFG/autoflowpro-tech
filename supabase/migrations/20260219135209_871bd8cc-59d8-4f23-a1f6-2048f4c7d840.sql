
-- Create prospects table for CRM pipeline
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  vehicle_interest TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Nouveau',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read prospects" ON public.prospects FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert prospects" ON public.prospects FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update prospects" ON public.prospects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete prospects" ON public.prospects FOR DELETE USING (true);

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

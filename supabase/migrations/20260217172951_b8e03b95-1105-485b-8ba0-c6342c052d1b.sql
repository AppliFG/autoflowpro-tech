
-- Table pour les événements agenda (immobilisations, livraisons, etc.)
CREATE TABLE public.vehicle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  client_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated full access" ON public.vehicle_events FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER update_vehicle_events_updated_at
  BEFORE UPDATE ON public.vehicle_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

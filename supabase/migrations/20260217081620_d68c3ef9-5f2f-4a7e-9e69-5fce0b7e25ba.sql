
-- Add client_visible flag, intervention date and km to vehicle_works
ALTER TABLE public.vehicle_works 
ADD COLUMN client_visible boolean NOT NULL DEFAULT true,
ADD COLUMN intervention_date date DEFAULT null,
ADD COLUMN intervention_km integer DEFAULT null;

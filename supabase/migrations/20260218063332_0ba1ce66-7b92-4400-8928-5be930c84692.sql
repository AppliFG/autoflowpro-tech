
-- Create invoices table to track generated invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  client_nom TEXT NOT NULL,
  client_adresse TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'En attente',
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies - authenticated users only
CREATE POLICY "Authenticated can read invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

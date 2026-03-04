
-- Create expenses table for tracking all costs
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Divers',
  subcategory text,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date DEFAULT CURRENT_DATE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  supplier_name text,
  invoice_number text,
  file_url text,
  file_type text,
  source text NOT NULL DEFAULT 'manual',
  ai_extracted_data jsonb,
  notes text,
  telegram_file_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated can read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

-- Allow service role (edge functions) to insert
CREATE POLICY "Service role can insert expenses" ON public.expenses FOR INSERT TO service_role WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for expense documents
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-documents', 'expense-documents', true);

-- Storage RLS
CREATE POLICY "Authenticated can upload expense docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'expense-documents');
CREATE POLICY "Anyone can view expense docs" ON storage.objects FOR SELECT USING (bucket_id = 'expense-documents');
CREATE POLICY "Authenticated can delete expense docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'expense-documents');
CREATE POLICY "Service role can upload expense docs" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'expense-documents');

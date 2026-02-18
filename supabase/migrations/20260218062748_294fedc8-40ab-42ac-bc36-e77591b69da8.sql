
-- Create storage bucket for generated invoices
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- Allow authenticated users to upload invoices
CREATE POLICY "Authenticated can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

-- Allow authenticated users to read invoices
CREATE POLICY "Authenticated can read invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete invoices
CREATE POLICY "Authenticated can delete invoices"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoices' AND auth.role() = 'authenticated');


INSERT INTO storage.buckets (id, name, public) VALUES ('agency-assets', 'agency-assets', true);

CREATE POLICY "Authenticated can upload agency assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agency-assets' AND (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated can update agency assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agency-assets' AND (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Authenticated can delete agency assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'agency-assets' AND (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Anyone can view agency assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-assets');

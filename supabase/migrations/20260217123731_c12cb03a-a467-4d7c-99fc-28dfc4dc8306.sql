-- Add photo_urls column to quotes table for reference photos
ALTER TABLE public.quotes ADD COLUMN photo_urls text[] DEFAULT '{}'::text[];

-- Create storage bucket for quote attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('quote-attachments', 'quote-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote-attachments bucket
CREATE POLICY "Authenticated users can upload quote attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Quote attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-attachments');

CREATE POLICY "Authenticated users can delete quote attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'quote-attachments' AND auth.role() = 'authenticated');

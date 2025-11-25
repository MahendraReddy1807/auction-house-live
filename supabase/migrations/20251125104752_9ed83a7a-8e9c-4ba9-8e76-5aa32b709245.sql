-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true);

-- Storage policies for team logos
CREATE POLICY "Anyone can view team logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

CREATE POLICY "Anyone can upload team logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-logos');

CREATE POLICY "Anyone can update their team logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-logos');
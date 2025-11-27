-- Add pause functionality to rooms
ALTER TABLE rooms 
ADD COLUMN is_paused boolean DEFAULT false;

-- Create activity log table for live commentary
CREATE TABLE auction_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE auction_activity ENABLE ROW LEVEL SECURITY;

-- Policies for auction_activity
CREATE POLICY "Anyone can view activity" 
ON auction_activity 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create activity" 
ON auction_activity 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for activity
ALTER PUBLICATION supabase_realtime ADD TABLE auction_activity;
-- Create enum types for better data integrity
CREATE TYPE player_role AS ENUM ('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER');
CREATE TYPE auction_status AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED');
CREATE TYPE room_status AS ENUM ('LOBBY', 'IN_PROGRESS', 'COMPLETED');

-- Users/Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  status room_status DEFAULT 'LOBBY',
  min_users INT DEFAULT 5,
  max_users INT DEFAULT 10,
  host_id UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id),
  team_name TEXT NOT NULL,
  logo_url TEXT,
  initial_purse NUMERIC DEFAULT 90,
  purse_left NUMERIC DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, participant_id)
);

-- Players pool table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role player_role NOT NULL,
  country TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  batting_score NUMERIC DEFAULT 0,
  bowling_score NUMERIC DEFAULT 0,
  overall_score NUMERIC DEFAULT 0,
  is_overseas BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction players tracking
CREATE TABLE auction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  status auction_status DEFAULT 'WAITING',
  current_bid NUMERIC,
  current_bidder_team_id UUID REFERENCES teams(id),
  sold_price NUMERIC,
  sold_to_team_id UUID REFERENCES teams(id),
  bid_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids history table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_player_id UUID REFERENCES auction_players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  bid_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team players (final squads)
CREATE TABLE team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  price NUMERIC NOT NULL,
  in_playing_xi BOOLEAN DEFAULT false,
  is_impact_player BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Team ratings table
CREATE TABLE team_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  overall_rating NUMERIC,
  batting_rating NUMERIC,
  bowling_rating NUMERIC,
  balance_score NUMERIC,
  bench_depth NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all authenticated and anonymous users to read/write for this multiplayer game)
-- Participants
CREATE POLICY "Anyone can create participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view participants" ON participants FOR SELECT USING (true);

-- Rooms
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true);

-- Teams
CREATE POLICY "Anyone can create teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Anyone can update teams" ON teams FOR UPDATE USING (true);

-- Players
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert players" ON players FOR INSERT WITH CHECK (true);

-- Auction players
CREATE POLICY "Anyone can view auction_players" ON auction_players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert auction_players" ON auction_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update auction_players" ON auction_players FOR UPDATE USING (true);

-- Bids
CREATE POLICY "Anyone can create bids" ON bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view bids" ON bids FOR SELECT USING (true);

-- Team players
CREATE POLICY "Anyone can create team_players" ON team_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view team_players" ON team_players FOR SELECT USING (true);
CREATE POLICY "Anyone can update team_players" ON team_players FOR UPDATE USING (true);

-- Team ratings
CREATE POLICY "Anyone can create team_ratings" ON team_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view team_ratings" ON team_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can update team_ratings" ON team_ratings FOR UPDATE USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE auction_players;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Insert sample player data
INSERT INTO players (name, role, country, base_price, batting_score, bowling_score, overall_score, is_overseas) VALUES
('Virat Kohli', 'BATSMAN', 'India', 2.0, 95, 20, 85, false),
('Rohit Sharma', 'BATSMAN', 'India', 2.0, 92, 25, 83, false),
('Jasprit Bumrah', 'BOWLER', 'India', 2.0, 15, 98, 82, false),
('Hardik Pandya', 'ALL_ROUNDER', 'India', 2.0, 78, 75, 85, false),
('MS Dhoni', 'WICKET_KEEPER', 'India', 2.0, 80, 10, 75, false),
('Ravindra Jadeja', 'ALL_ROUNDER', 'India', 2.0, 72, 85, 83, false),
('KL Rahul', 'WICKET_KEEPER', 'India', 1.5, 85, 15, 78, false),
('Mohammed Shami', 'BOWLER', 'India', 1.5, 12, 90, 76, false),
('Ben Stokes', 'ALL_ROUNDER', 'England', 2.0, 82, 80, 88, true),
('Jos Buttler', 'WICKET_KEEPER', 'England', 2.0, 88, 10, 80, true),
('David Warner', 'BATSMAN', 'Australia', 1.5, 90, 20, 82, true),
('Pat Cummins', 'BOWLER', 'Australia', 2.0, 20, 95, 84, true),
('Glenn Maxwell', 'ALL_ROUNDER', 'Australia', 2.0, 75, 70, 80, true),
('Kagiso Rabada', 'BOWLER', 'South Africa', 2.0, 15, 93, 81, true),
('Quinton de Kock', 'WICKET_KEEPER', 'South Africa', 1.5, 82, 10, 76, true),
('Trent Boult', 'BOWLER', 'New Zealand', 1.5, 10, 88, 75, true),
('Kane Williamson', 'BATSMAN', 'New Zealand', 2.0, 86, 30, 80, true),
('Rashid Khan', 'BOWLER', 'Afghanistan', 2.0, 35, 92, 82, true),
('Suryakumar Yadav', 'BATSMAN', 'India', 1.0, 88, 25, 79, false),
('Shubman Gill', 'BATSMAN', 'India', 1.0, 85, 20, 77, false),
('Rishabh Pant', 'WICKET_KEEPER', 'India', 2.0, 83, 10, 78, false),
('Yuzvendra Chahal', 'BOWLER', 'India', 1.0, 15, 87, 74, false),
('Axar Patel', 'ALL_ROUNDER', 'India', 0.5, 65, 78, 74, false),
('Ishan Kishan', 'WICKET_KEEPER', 'India', 1.0, 80, 10, 73, false),
('Mohammed Siraj', 'BOWLER', 'India', 1.0, 10, 86, 73, false),
('Andre Russell', 'ALL_ROUNDER', 'West Indies', 2.0, 78, 72, 82, true),
('Sunil Narine', 'ALL_ROUNDER', 'West Indies', 1.5, 60, 85, 77, true),
('Jason Holder', 'ALL_ROUNDER', 'West Indies', 1.0, 68, 80, 76, true),
('Marcus Stoinis', 'ALL_ROUNDER', 'Australia', 1.0, 72, 68, 74, true),
('Mitchell Starc', 'BOWLER', 'Australia', 2.0, 12, 91, 79, true),
('Steve Smith', 'BATSMAN', 'Australia', 2.0, 88, 25, 81, true),
('Josh Hazlewood', 'BOWLER', 'Australia', 1.5, 10, 89, 77, true),
('Sam Curran', 'ALL_ROUNDER', 'England', 1.5, 70, 76, 78, true),
('Jonny Bairstow', 'WICKET_KEEPER', 'England', 1.5, 84, 10, 76, true),
('Jofra Archer', 'BOWLER', 'England', 2.0, 18, 90, 80, true),
('Lockie Ferguson', 'BOWLER', 'New Zealand', 1.0, 12, 87, 74, true),
('Washington Sundar', 'ALL_ROUNDER', 'India', 0.5, 62, 75, 72, false),
('Deepak Chahar', 'BOWLER', 'India', 0.5, 25, 82, 72, false),
('Prithvi Shaw', 'BATSMAN', 'India', 0.75, 80, 15, 72, false),
('Devdutt Padikkal', 'BATSMAN', 'India', 0.5, 78, 10, 70, false);

-- Create indexes for better performance
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_teams_room_id ON teams(room_id);
CREATE INDEX idx_auction_players_room_id ON auction_players(room_id);
CREATE INDEX idx_bids_auction_player_id ON bids(auction_player_id);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
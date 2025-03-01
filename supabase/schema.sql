-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game table to track the current game state
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shoe JSONB DEFAULT '[]',
  cards_played INTEGER DEFAULT 0,
  is_dealing BOOLEAN DEFAULT TRUE,
  show_dealer_hole_card BOOLEAN DEFAULT FALSE,
  is_game_over BOOLEAN DEFAULT FALSE,
  dealer_hands JSONB DEFAULT '[{"id": "dealer", "cards": [], "bet": 0}]',
  active_player_id UUID DEFAULT NULL,
  active_hand_id TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table to track players in the game
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  bank INTEGER DEFAULT 20,
  is_dealer BOOLEAN DEFAULT FALSE,
  hands JSONB DEFAULT '[{"id": "0", "cards": [], "bet": 0}]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, seat_number),
  UNIQUE(game_id, name)
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update the updated_at column
CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Enable realtime for players table
ALTER PUBLICATION supabase_realtime ADD TABLE players; 
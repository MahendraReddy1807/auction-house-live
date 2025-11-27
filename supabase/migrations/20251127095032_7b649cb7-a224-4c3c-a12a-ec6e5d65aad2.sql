-- Add auction configuration columns to rooms table
ALTER TABLE rooms 
ADD COLUMN timer_duration integer DEFAULT 30,
ADD COLUMN bid_increment_small numeric DEFAULT 0.5,
ADD COLUMN bid_increment_medium numeric DEFAULT 1,
ADD COLUMN bid_increment_large numeric DEFAULT 2;
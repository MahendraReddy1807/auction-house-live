-- Add is_ready column to teams table for ready status
ALTER TABLE public.teams 
ADD COLUMN is_ready boolean DEFAULT false;
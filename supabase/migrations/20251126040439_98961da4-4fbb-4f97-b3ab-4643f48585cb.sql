-- Update min_users default from 5 to 2
ALTER TABLE public.rooms 
ALTER COLUMN min_users SET DEFAULT 2;
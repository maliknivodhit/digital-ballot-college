-- Add candidate information fields directly to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS student_id TEXT,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Make user_id nullable since candidates don't need to be actual auth users
ALTER TABLE public.candidates 
ALTER COLUMN user_id DROP NOT NULL;
-- Update sahilrajput821831@gmail.com to admin role
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = 'beee86f6-25aa-4a2d-8b59-84d794ad6ddc';
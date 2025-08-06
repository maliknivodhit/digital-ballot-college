-- Create trigger to handle admin role assignment during signup
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if the user has admin role in raw_user_meta_data
  IF new.raw_user_meta_data->>'role' = 'admin' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  ELSE
    -- Insert default student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'student');
  END IF;
  
  RETURN new;
END;
$function$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_signup();
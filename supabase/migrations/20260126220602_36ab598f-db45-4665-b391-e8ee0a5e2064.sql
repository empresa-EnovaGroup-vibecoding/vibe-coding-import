-- Create function to allow first user to become admin (bypassing RLS)
CREATE OR REPLACE FUNCTION public.assign_first_admin(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if no admins exist yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin');
  ELSE
    RAISE EXCEPTION 'An admin already exists';
  END IF;
END;
$$;
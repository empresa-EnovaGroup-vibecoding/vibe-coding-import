-- Create packages table (package templates)
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  validity_days INTEGER DEFAULT 365,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_packages table (purchased packages)
CREATE TABLE public.client_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  sessions_total INTEGER NOT NULL CHECK (sessions_total > 0),
  sessions_used INTEGER NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT sessions_used_not_exceed_total CHECK (sessions_used <= sessions_total)
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for packages
CREATE POLICY "Staff and admins can view packages"
  ON public.packages FOR SELECT
  TO authenticated
  USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can create packages"
  ON public.packages FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update packages"
  ON public.packages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete packages"
  ON public.packages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for client_packages
CREATE POLICY "Staff and admins can view client_packages"
  ON public.client_packages FOR SELECT
  TO authenticated
  USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create client_packages"
  ON public.client_packages FOR INSERT
  TO authenticated
  WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update client_packages"
  ON public.client_packages FOR UPDATE
  TO authenticated
  USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete client_packages"
  ON public.client_packages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to use a session from a package
CREATE OR REPLACE FUNCTION public.use_package_session(p_client_package_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_used INTEGER;
  v_sessions_total INTEGER;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT sessions_used, sessions_total, expires_at
  INTO v_sessions_used, v_sessions_total, v_expires_at
  FROM public.client_packages
  WHERE id = p_client_package_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'Package has expired';
  END IF;

  IF v_sessions_used >= v_sessions_total THEN
    RAISE EXCEPTION 'No sessions remaining';
  END IF;

  UPDATE public.client_packages
  SET sessions_used = sessions_used + 1,
      updated_at = now()
  WHERE id = p_client_package_id;

  RETURN TRUE;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_packages_updated_at
  BEFORE UPDATE ON public.client_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
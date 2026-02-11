-- =====================================================
-- PASO 1 DE 5: SECURITY HARDENING
-- Copia TODO este bloque y pegalo en el SQL Editor de Supabase
-- Luego haz click en "Run"
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_exists() TO authenticated;

ALTER TABLE public.clients
ADD CONSTRAINT clients_email_format
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.clients
ADD CONSTRAINT clients_phone_format
CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{6,20}$');

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.audit_user_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_services_user ON public.services;
CREATE TRIGGER audit_services_user
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

DROP TRIGGER IF EXISTS audit_inventory_user ON public.inventory;
CREATE TRIGGER audit_inventory_user
BEFORE INSERT OR UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

DROP TRIGGER IF EXISTS audit_sales_user ON public.sales;
CREATE TRIGGER audit_sales_user
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

DROP TRIGGER IF EXISTS audit_appointments_user ON public.appointments;
CREATE TRIGGER audit_appointments_user
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

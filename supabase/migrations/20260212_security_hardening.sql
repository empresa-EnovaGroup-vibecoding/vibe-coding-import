-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fecha: 2026-02-12
-- Descripcion: Mejoras de seguridad para modelo SaaS
-- =====================================================

-- 1. Funcion segura para verificar si existe algun admin
-- Usada en RoleSetup para mostrar la UI correcta
-- SECURITY DEFINER: bypasa RLS para ver todos los roles
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

-- Permitir que cualquier usuario autenticado llame esta funcion
-- (solo devuelve true/false, no expone datos sensibles)
GRANT EXECUTE ON FUNCTION public.check_admin_exists() TO authenticated;

-- 2. Validacion de formato de email en clientes
ALTER TABLE public.clients
ADD CONSTRAINT clients_email_format
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 3. Validacion de formato de telefono en clientes
-- Permite: +, numeros, espacios, guiones, parentesis
ALTER TABLE public.clients
ADD CONSTRAINT clients_phone_format
CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{6,20}$');

-- 4. Agregar campos de auditoria a tablas criticas
-- Saber QUIEN creo/modifico cada registro
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

-- 5. Trigger automatico para capturar quien modifica registros
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

-- Aplicar trigger a tablas criticas
CREATE TRIGGER audit_services_user
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

CREATE TRIGGER audit_inventory_user
BEFORE INSERT OR UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

CREATE TRIGGER audit_sales_user
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

CREATE TRIGGER audit_appointments_user
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.audit_user_tracking();

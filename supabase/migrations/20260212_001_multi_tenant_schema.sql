-- =====================================================
-- MULTI-TENANT SCHEMA
-- Convierte AGENDA-PRO de single-tenant a multi-tenant SaaS
-- =====================================================

-- 1. Crear enum para roles de tenant
CREATE TYPE public.tenant_role AS ENUM ('super_admin', 'owner', 'staff');

-- 2. Tabla central: los negocios (tenants)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  -- Subscription
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  plan_type TEXT DEFAULT 'monthly'
    CHECK (plan_type IN ('monthly', 'annual')),
  current_period_end TIMESTAMPTZ,
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Constraints
  CONSTRAINT tenants_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT tenants_name_max_length CHECK (length(name) <= 255),
  CONSTRAINT tenants_slug_format CHECK (slug ~* '^[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]$'),
  CONSTRAINT tenants_phone_max_length CHECK (phone IS NULL OR length(phone) <= 50),
  CONSTRAINT tenants_address_max_length CHECK (address IS NULL OR length(address) <= 500)
);

-- Indice para busquedas por slug (login por URL)
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX idx_tenants_subscription ON public.tenants(subscription_status);

-- Trigger updated_at
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tabla de miembros del tenant (relacion usuario <-> negocio)
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_role ON public.tenant_members(role);

-- 4. Tabla del super_admin (solo TU)
-- Separada para maxima seguridad - no depende de ningun tenant
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Funciones de seguridad SECURITY DEFINER

-- Verificar si usuario es super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.super_admins WHERE user_id = _user_id
    )
  END
$$;

-- Obtener tenant_ids de un usuario
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = _user_id
$$;

-- Verificar si usuario pertenece a un tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _tenant_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE user_id = _user_id AND tenant_id = _tenant_id
    )
  END
$$;

-- Verificar si usuario es owner de un tenant
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _tenant_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = 'owner'
    )
  END
$$;

-- Verificar si el tenant tiene suscripcion activa (o trial vigente)
CREATE OR REPLACE FUNCTION public.tenant_has_active_subscription(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _tenant_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = _tenant_id
      AND (
        subscription_status = 'active'
        OR (subscription_status = 'trial' AND trial_ends_at > now())
      )
    )
  END
$$;

-- 6. Funcion para crear un nuevo negocio (onboarding)
CREATE OR REPLACE FUNCTION public.create_tenant(
  _name TEXT,
  _slug TEXT,
  _phone TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Crear el tenant
  INSERT INTO public.tenants (name, slug, owner_id, phone, address)
  VALUES (_name, _slug, _user_id, _phone, _address)
  RETURNING id INTO _tenant_id;

  -- Agregar al creador como owner
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (_tenant_id, _user_id, 'owner');

  RETURN _tenant_id;
END;
$$;

-- Permitir a cualquier autenticado crear un negocio
GRANT EXECUTE ON FUNCTION public.create_tenant(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 7. Funcion para verificar slug disponible
CREATE OR REPLACE FUNCTION public.is_slug_available(_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE slug = _slug
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_slug_available(TEXT) TO authenticated;

-- 8. RLS para tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Super admins ven todo
CREATE POLICY "Super admins can view all tenants"
ON public.tenants FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Miembros ven su propio tenant
CREATE POLICY "Members can view own tenant"
ON public.tenants FOR SELECT TO authenticated
USING (
  id IN (SELECT get_user_tenant_ids(auth.uid()))
);

-- Solo owners pueden actualizar su tenant
CREATE POLICY "Owners can update own tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (is_tenant_owner(auth.uid(), id));

-- Super admin puede actualizar cualquier tenant
CREATE POLICY "Super admin can update any tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()));

-- Insert se hace via create_tenant() function (SECURITY DEFINER)
-- No necesita policy directa

-- 9. RLS para tenant_members
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Super admins ven todos los miembros
CREATE POLICY "Super admins can view all members"
ON public.tenant_members FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Miembros del mismo tenant ven a sus companeros
CREATE POLICY "Members can view same tenant members"
ON public.tenant_members FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
);

-- Solo owners pueden agregar miembros a su tenant
CREATE POLICY "Owners can add members"
ON public.tenant_members FOR INSERT TO authenticated
WITH CHECK (is_tenant_owner(auth.uid(), tenant_id));

-- Solo owners pueden modificar miembros
CREATE POLICY "Owners can update members"
ON public.tenant_members FOR UPDATE TO authenticated
USING (is_tenant_owner(auth.uid(), tenant_id));

-- Solo owners pueden eliminar miembros (pero no a si mismos)
CREATE POLICY "Owners can remove members"
ON public.tenant_members FOR DELETE TO authenticated
USING (
  is_tenant_owner(auth.uid(), tenant_id)
  AND user_id != auth.uid()
);

-- Super admin puede gestionar miembros de cualquier tenant
CREATE POLICY "Super admin can manage all members"
ON public.tenant_members FOR ALL TO authenticated
USING (is_super_admin(auth.uid()));

-- 10. RLS para super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Solo super_admins pueden ver la tabla
CREATE POLICY "Super admins can view super_admins"
ON public.super_admins FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Nadie puede insertar via API (se hace directamente en SQL por el dueno)
-- Esto es intencional: TU te agregas manualmente una sola vez

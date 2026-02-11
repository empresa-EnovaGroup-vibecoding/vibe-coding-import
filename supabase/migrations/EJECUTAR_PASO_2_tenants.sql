-- =====================================================
-- PASO 2 DE 5: CREAR TABLAS MULTI-TENANT
-- Copia TODO este bloque y pegalo en el SQL Editor de Supabase
-- Luego haz click en "Run"
-- =====================================================

-- Crear enum para roles
DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('super_admin', 'owner', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tabla de negocios
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  plan_type TEXT DEFAULT 'monthly'
    CHECK (plan_type IN ('monthly', 'annual')),
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenants_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT tenants_name_max_length CHECK (length(name) <= 255),
  CONSTRAINT tenants_slug_format CHECK (slug ~* '^[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]$'),
  CONSTRAINT tenants_phone_max_length CHECK (phone IS NULL OR length(phone) <= 50),
  CONSTRAINT tenants_address_max_length CHECK (address IS NULL OR length(address) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON public.tenants(subscription_status);

-- Trigger para updated_at (crear funcion si no existe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de miembros (usuario <-> negocio)
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON public.tenant_members(role);

-- Tabla de super admins (solo TU)
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funciones de seguridad
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
  END
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = _user_id
$$;

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

-- Funcion para crear negocio (onboarding)
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
  INSERT INTO public.tenants (name, slug, owner_id, phone, address)
  VALUES (_name, _slug, _user_id, _phone, _address)
  RETURNING id INTO _tenant_id;
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (_tenant_id, _user_id, 'owner');
  RETURN _tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_slug_available(_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = _slug)
$$;

GRANT EXECUTE ON FUNCTION public.is_slug_available(TEXT) TO authenticated;

-- RLS para tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all tenants"
ON public.tenants FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Members can view own tenant"
ON public.tenants FOR SELECT TO authenticated
USING (id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Owners can update own tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (is_tenant_owner(auth.uid(), id));

CREATE POLICY "Super admin can update any tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()));

-- RLS para tenant_members
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all members"
ON public.tenant_members FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Members can view same tenant members"
ON public.tenant_members FOR SELECT TO authenticated
USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Owners can add members"
ON public.tenant_members FOR INSERT TO authenticated
WITH CHECK (is_tenant_owner(auth.uid(), tenant_id));

CREATE POLICY "Owners can update members"
ON public.tenant_members FOR UPDATE TO authenticated
USING (is_tenant_owner(auth.uid(), tenant_id));

CREATE POLICY "Owners can remove members"
ON public.tenant_members FOR DELETE TO authenticated
USING (
  is_tenant_owner(auth.uid(), tenant_id)
  AND user_id != auth.uid()
);

CREATE POLICY "Super admin can manage all members"
ON public.tenant_members FOR ALL TO authenticated
USING (is_super_admin(auth.uid()));

-- RLS para super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view super_admins"
ON public.super_admins FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

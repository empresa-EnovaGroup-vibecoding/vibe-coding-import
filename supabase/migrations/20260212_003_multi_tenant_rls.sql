-- =====================================================
-- MULTI-TENANT RLS POLICIES
-- Reemplaza todas las politicas single-tenant con multi-tenant
-- Patron: Los usuarios solo ven datos de SU negocio
-- Super admin ve TODO
-- =====================================================

-- Funcion helper: obtener tenant_ids del usuario actual
-- (optimizada, se usa en todas las policies)
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
$$;

-- Funcion helper: verificar si es owner en algun tenant del usuario
CREATE OR REPLACE FUNCTION public.is_owner_of_tenant(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _tenant_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE user_id = auth.uid() AND tenant_id = _tenant_id AND role = 'owner'
    )
  END
$$;

-- =====================================================
-- CLIENTS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view clients" ON public.clients;
DROP POLICY IF EXISTS "Staff and admins can create clients" ON public.clients;
DROP POLICY IF EXISTS "Staff and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON public.clients;

CREATE POLICY "Tenant members can view clients"
ON public.clients FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create clients"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update clients"
ON public.clients FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete clients"
ON public.clients FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- SERVICES
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view services" ON public.services;
DROP POLICY IF EXISTS "Only admins can create services" ON public.services;
DROP POLICY IF EXISTS "Only admins can update services" ON public.services;
DROP POLICY IF EXISTS "Only admins can delete services" ON public.services;

CREATE POLICY "Tenant members can view services"
ON public.services FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant owners can create services"
ON public.services FOR INSERT TO authenticated
WITH CHECK (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can update services"
ON public.services FOR UPDATE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can delete services"
ON public.services FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- INVENTORY
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Only admins can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Only admins can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Only admins can delete inventory" ON public.inventory;

CREATE POLICY "Tenant members can view inventory"
ON public.inventory FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant owners can create inventory"
ON public.inventory FOR INSERT TO authenticated
WITH CHECK (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can update inventory"
ON public.inventory FOR UPDATE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can delete inventory"
ON public.inventory FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- APPOINTMENTS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff and admins can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff and admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Only admins can delete appointments" ON public.appointments;

CREATE POLICY "Tenant members can view appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete appointments"
ON public.appointments FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- APPOINTMENT_SERVICES
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff and admins can create appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff and admins can update appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Only admins can delete appointment_services" ON public.appointment_services;

CREATE POLICY "Tenant members can view appointment_services"
ON public.appointment_services FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create appointment_services"
ON public.appointment_services FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update appointment_services"
ON public.appointment_services FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete appointment_services"
ON public.appointment_services FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- SALES
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view sales" ON public.sales;
DROP POLICY IF EXISTS "Staff and admins can create sales" ON public.sales;
DROP POLICY IF EXISTS "Staff and admins can update sales" ON public.sales;
DROP POLICY IF EXISTS "Only admins can delete sales" ON public.sales;

CREATE POLICY "Tenant members can view sales"
ON public.sales FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create sales"
ON public.sales FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update sales"
ON public.sales FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete sales"
ON public.sales FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- SALE_ITEMS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff and admins can create sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff and admins can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Only admins can delete sale_items" ON public.sale_items;

CREATE POLICY "Tenant members can view sale_items"
ON public.sale_items FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create sale_items"
ON public.sale_items FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update sale_items"
ON public.sale_items FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete sale_items"
ON public.sale_items FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- TEAM_MEMBERS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view team_members" ON public.team_members;
DROP POLICY IF EXISTS "Only admins can create team_members" ON public.team_members;
DROP POLICY IF EXISTS "Only admins can update team_members" ON public.team_members;
DROP POLICY IF EXISTS "Only admins can delete team_members" ON public.team_members;

CREATE POLICY "Tenant members can view team_members"
ON public.team_members FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant owners can create team_members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can update team_members"
ON public.team_members FOR UPDATE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can delete team_members"
ON public.team_members FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- CABINS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view cabins" ON public.cabins;
DROP POLICY IF EXISTS "Only admins can create cabins" ON public.cabins;
DROP POLICY IF EXISTS "Only admins can update cabins" ON public.cabins;
DROP POLICY IF EXISTS "Only admins can delete cabins" ON public.cabins;

CREATE POLICY "Tenant members can view cabins"
ON public.cabins FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant owners can create cabins"
ON public.cabins FOR INSERT TO authenticated
WITH CHECK (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can update cabins"
ON public.cabins FOR UPDATE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can delete cabins"
ON public.cabins FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- PACKAGES
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view packages" ON public.packages;
DROP POLICY IF EXISTS "Only admins can create packages" ON public.packages;
DROP POLICY IF EXISTS "Only admins can update packages" ON public.packages;
DROP POLICY IF EXISTS "Only admins can delete packages" ON public.packages;

CREATE POLICY "Tenant members can view packages"
ON public.packages FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant owners can create packages"
ON public.packages FOR INSERT TO authenticated
WITH CHECK (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can update packages"
ON public.packages FOR UPDATE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
);

CREATE POLICY "Tenant owners can delete packages"
ON public.packages FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- CLIENT_PACKAGES
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view client_packages" ON public.client_packages;
DROP POLICY IF EXISTS "Staff and admins can create client_packages" ON public.client_packages;
DROP POLICY IF EXISTS "Staff and admins can update client_packages" ON public.client_packages;
DROP POLICY IF EXISTS "Only admins can delete client_packages" ON public.client_packages;

CREATE POLICY "Tenant members can view client_packages"
ON public.client_packages FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create client_packages"
ON public.client_packages FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update client_packages"
ON public.client_packages FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete client_packages"
ON public.client_packages FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- FACIAL_EVALUATIONS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff and admins can create facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff and admins can update facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Only admins can delete facial_evaluations" ON public.facial_evaluations;

CREATE POLICY "Tenant members can view facial_evaluations"
ON public.facial_evaluations FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create facial_evaluations"
ON public.facial_evaluations FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update facial_evaluations"
ON public.facial_evaluations FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete facial_evaluations"
ON public.facial_evaluations FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- EVALUATION_PRODUCT_RECOMMENDATIONS
-- =====================================================
DROP POLICY IF EXISTS "Staff and admins can view evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff and admins can create evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff and admins can update evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Only admins can delete evaluation_product_recommendations" ON public.evaluation_product_recommendations;

CREATE POLICY "Tenant members can view evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Tenant members can create evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant members can update evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT user_tenant_ids())
);

CREATE POLICY "Tenant owners can delete evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR DELETE TO authenticated
USING (
  is_owner_of_tenant(tenant_id)
  OR is_super_admin(auth.uid())
);

-- =====================================================
-- PROFILES - Actualizar para super_admin
-- =====================================================
-- Super admin puede ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Super admin can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()));

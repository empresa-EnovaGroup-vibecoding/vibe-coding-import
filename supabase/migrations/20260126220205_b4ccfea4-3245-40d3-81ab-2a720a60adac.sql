-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any role (is staff or admin)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS policies for user_roles table
-- Only admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- UPDATE RLS POLICIES FOR ALL TABLES
-- Admin: Full access to everything
-- Staff: Operational access (view/create for most, restricted for admin-level tables)
-- =====================================================

-- CLIENTS TABLE - Staff can manage clients (operational task)
DROP POLICY IF EXISTS "Staff can view clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can create clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can delete clients" ON public.clients;

CREATE POLICY "Staff and admins can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- APPOINTMENTS TABLE - Staff can manage appointments (operational task)
DROP POLICY IF EXISTS "Staff can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can delete appointments" ON public.appointments;

CREATE POLICY "Staff and admins can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- APPOINTMENT_SERVICES TABLE - Staff can manage (operational)
DROP POLICY IF EXISTS "Staff can view appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff can create appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff can update appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff can delete appointment_services" ON public.appointment_services;

CREATE POLICY "Staff and admins can view appointment_services"
ON public.appointment_services FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create appointment_services"
ON public.appointment_services FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update appointment_services"
ON public.appointment_services FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete appointment_services"
ON public.appointment_services FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SERVICES TABLE - Staff can only VIEW services (admin manages pricing)
DROP POLICY IF EXISTS "Staff can view services" ON public.services;
DROP POLICY IF EXISTS "Staff can create services" ON public.services;
DROP POLICY IF EXISTS "Staff can update services" ON public.services;
DROP POLICY IF EXISTS "Staff can delete services" ON public.services;

CREATE POLICY "Staff and admins can view services"
ON public.services FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can create services"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update services"
ON public.services FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete services"
ON public.services FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- INVENTORY TABLE - Staff can only VIEW inventory (admin manages stock/pricing)
DROP POLICY IF EXISTS "Staff can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can delete inventory" ON public.inventory;

CREATE POLICY "Staff and admins can view inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can create inventory"
ON public.inventory FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update inventory"
ON public.inventory FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete inventory"
ON public.inventory FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SALES TABLE - Staff can manage sales (operational task)
DROP POLICY IF EXISTS "Staff can view sales" ON public.sales;
DROP POLICY IF EXISTS "Staff can create sales" ON public.sales;
DROP POLICY IF EXISTS "Staff can update sales" ON public.sales;
DROP POLICY IF EXISTS "Staff can delete sales" ON public.sales;

CREATE POLICY "Staff and admins can view sales"
ON public.sales FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create sales"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update sales"
ON public.sales FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete sales"
ON public.sales FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SALE_ITEMS TABLE - Staff can manage (operational)
DROP POLICY IF EXISTS "Staff can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff can create sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff can delete sale_items" ON public.sale_items;

CREATE POLICY "Staff and admins can view sale_items"
ON public.sale_items FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create sale_items"
ON public.sale_items FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update sale_items"
ON public.sale_items FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete sale_items"
ON public.sale_items FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- FACIAL_EVALUATIONS TABLE - Staff can manage evaluations (operational)
DROP POLICY IF EXISTS "Staff can view facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff can create facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff can update facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff can delete facial_evaluations" ON public.facial_evaluations;

CREATE POLICY "Staff and admins can view facial_evaluations"
ON public.facial_evaluations FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create facial_evaluations"
ON public.facial_evaluations FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update facial_evaluations"
ON public.facial_evaluations FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete facial_evaluations"
ON public.facial_evaluations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- EVALUATION_PRODUCT_RECOMMENDATIONS TABLE - Staff can manage (operational)
DROP POLICY IF EXISTS "Staff can view evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff can create evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff can update evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff can delete evaluation_product_recommendations" ON public.evaluation_product_recommendations;

CREATE POLICY "Staff and admins can view evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete evaluation_product_recommendations"
ON public.evaluation_product_recommendations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES TABLE - Keep existing policies (users manage their own profile)
-- No changes needed as profiles are user-specific
-- Update is_staff_or_admin to explicitly handle NULL user_id
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
    )
  END
$$;

-- Update has_role to explicitly handle NULL user_id
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$$;

-- Drop and recreate policies for clients table with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view clients" ON public.clients;
DROP POLICY IF EXISTS "Staff and admins can create clients" ON public.clients;
DROP POLICY IF EXISTS "Staff and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON public.clients;

CREATE POLICY "Staff and admins can view clients" ON public.clients
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create clients" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update clients" ON public.clients
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete clients" ON public.clients
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for facial_evaluations with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff and admins can create facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Staff and admins can update facial_evaluations" ON public.facial_evaluations;
DROP POLICY IF EXISTS "Only admins can delete facial_evaluations" ON public.facial_evaluations;

CREATE POLICY "Staff and admins can view facial_evaluations" ON public.facial_evaluations
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create facial_evaluations" ON public.facial_evaluations
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update facial_evaluations" ON public.facial_evaluations
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete facial_evaluations" ON public.facial_evaluations
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for appointments with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff and admins can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff and admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Only admins can delete appointments" ON public.appointments;

CREATE POLICY "Staff and admins can view appointments" ON public.appointments
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update appointments" ON public.appointments
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete appointments" ON public.appointments
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for appointment_services with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff and admins can create appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Staff and admins can update appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Only admins can delete appointment_services" ON public.appointment_services;

CREATE POLICY "Staff and admins can view appointment_services" ON public.appointment_services
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create appointment_services" ON public.appointment_services
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update appointment_services" ON public.appointment_services
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete appointment_services" ON public.appointment_services
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for services with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view services" ON public.services;
DROP POLICY IF EXISTS "Only admins can create services" ON public.services;
DROP POLICY IF EXISTS "Only admins can update services" ON public.services;
DROP POLICY IF EXISTS "Only admins can delete services" ON public.services;

CREATE POLICY "Staff and admins can view services" ON public.services
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can create services" ON public.services
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update services" ON public.services
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete services" ON public.services
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for inventory with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Only admins can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Only admins can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Only admins can delete inventory" ON public.inventory;

CREATE POLICY "Staff and admins can view inventory" ON public.inventory
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can create inventory" ON public.inventory
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update inventory" ON public.inventory
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete inventory" ON public.inventory
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for sales with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view sales" ON public.sales;
DROP POLICY IF EXISTS "Staff and admins can create sales" ON public.sales;
DROP POLICY IF EXISTS "Staff and admins can update sales" ON public.sales;
DROP POLICY IF EXISTS "Only admins can delete sales" ON public.sales;

CREATE POLICY "Staff and admins can view sales" ON public.sales
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create sales" ON public.sales
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update sales" ON public.sales
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete sales" ON public.sales
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for sale_items with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff and admins can create sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Staff and admins can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Only admins can delete sale_items" ON public.sale_items;

CREATE POLICY "Staff and admins can view sale_items" ON public.sale_items
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create sale_items" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update sale_items" ON public.sale_items
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete sale_items" ON public.sale_items
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Drop and recreate policies for evaluation_product_recommendations with explicit auth check
DROP POLICY IF EXISTS "Staff and admins can view evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff and admins can create evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Staff and admins can update evaluation_product_recommendations" ON public.evaluation_product_recommendations;
DROP POLICY IF EXISTS "Only admins can delete evaluation_product_recommendations" ON public.evaluation_product_recommendations;

CREATE POLICY "Staff and admins can view evaluation_product_recommendations" ON public.evaluation_product_recommendations
FOR SELECT TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can create evaluation_product_recommendations" ON public.evaluation_product_recommendations
FOR INSERT TO authenticated
WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update evaluation_product_recommendations" ON public.evaluation_product_recommendations
FOR UPDATE TO authenticated
USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete evaluation_product_recommendations" ON public.evaluation_product_recommendations
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update user_roles policies with explicit auth check
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR (user_id = auth.uid()));

CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));
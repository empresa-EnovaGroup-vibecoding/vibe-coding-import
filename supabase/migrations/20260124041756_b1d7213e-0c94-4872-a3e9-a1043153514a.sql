-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies - users can only see and edit their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now update RLS policies for all tables to require authentication

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all operations on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all operations on services" ON public.services;
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all operations on appointment_services" ON public.appointment_services;
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations on sale_items" ON public.sale_items;

-- CLIENTS: Only authenticated users can access
CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (true);

-- SERVICES: Only authenticated users can access
CREATE POLICY "Authenticated users can view services"
ON public.services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create services"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
ON public.services FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete services"
ON public.services FOR DELETE
TO authenticated
USING (true);

-- INVENTORY: Only authenticated users can access
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create inventory"
ON public.inventory FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
ON public.inventory FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete inventory"
ON public.inventory FOR DELETE
TO authenticated
USING (true);

-- APPOINTMENTS: Only authenticated users can access
CREATE POLICY "Authenticated users can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (true);

-- APPOINTMENT_SERVICES: Only authenticated users can access
CREATE POLICY "Authenticated users can view appointment_services"
ON public.appointment_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create appointment_services"
ON public.appointment_services FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointment_services"
ON public.appointment_services FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete appointment_services"
ON public.appointment_services FOR DELETE
TO authenticated
USING (true);

-- SALES: Only authenticated users can access
CREATE POLICY "Authenticated users can view sales"
ON public.sales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create sales"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
ON public.sales FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete sales"
ON public.sales FOR DELETE
TO authenticated
USING (true);

-- SALE_ITEMS: Only authenticated users can access
CREATE POLICY "Authenticated users can view sale_items"
ON public.sale_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create sale_items"
ON public.sale_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sale_items"
ON public.sale_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete sale_items"
ON public.sale_items FOR DELETE
TO authenticated
USING (true);
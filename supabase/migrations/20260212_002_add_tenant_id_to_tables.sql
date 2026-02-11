-- =====================================================
-- ADD tenant_id TO ALL EXISTING TABLES
-- This migration adds multi-tenant support to all data tables
-- =====================================================

-- NOTA: tenant_id se agrega como NULLABLE primero,
-- luego se llena con datos existentes, y finalmente se hace NOT NULL.
-- Esto permite migrar datos existentes sin romper nada.

-- 1. Agregar tenant_id a cada tabla
ALTER TABLE public.clients ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.appointment_services ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sale_items ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cabins ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.packages ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.client_packages ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.facial_evaluations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.evaluation_product_recommendations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Crear indices para performance (todas las queries filtran por tenant_id)
CREATE INDEX idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX idx_services_tenant ON public.services(tenant_id);
CREATE INDEX idx_inventory_tenant ON public.inventory(tenant_id);
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX idx_appointment_services_tenant ON public.appointment_services(tenant_id);
CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sale_items_tenant ON public.sale_items(tenant_id);
CREATE INDEX idx_team_members_tenant ON public.team_members(tenant_id);
CREATE INDEX idx_cabins_tenant ON public.cabins(tenant_id);
CREATE INDEX idx_packages_tenant ON public.packages(tenant_id);
CREATE INDEX idx_client_packages_tenant ON public.client_packages(tenant_id);
CREATE INDEX idx_facial_evaluations_tenant ON public.facial_evaluations(tenant_id);
CREATE INDEX idx_eval_prod_rec_tenant ON public.evaluation_product_recommendations(tenant_id);

-- 3. Indices compuestos para queries comunes (tenant + busqueda)
CREATE INDEX idx_clients_tenant_name ON public.clients(tenant_id, name);
CREATE INDEX idx_appointments_tenant_start ON public.appointments(tenant_id, start_time);
CREATE INDEX idx_sales_tenant_created ON public.sales(tenant_id, created_at);
CREATE INDEX idx_inventory_tenant_stock ON public.inventory(tenant_id, stock_level);

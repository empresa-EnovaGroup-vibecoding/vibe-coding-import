-- =====================================================
-- PASO 3 DE 5: AGREGAR tenant_id A TODAS LAS TABLAS
-- Copia TODO este bloque y pegalo en el SQL Editor de Supabase
-- Luego haz click en "Run"
-- =====================================================

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.appointment_services ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cabins ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.client_packages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.facial_evaluations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.evaluation_product_recommendations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON public.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_tenant ON public.appointment_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant ON public.sale_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON public.team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cabins_tenant ON public.cabins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_packages_tenant ON public.packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_tenant ON public.client_packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_facial_evaluations_tenant ON public.facial_evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_eval_prod_rec_tenant ON public.evaluation_product_recommendations(tenant_id);

-- Indices compuestos
CREATE INDEX IF NOT EXISTS idx_clients_tenant_name ON public.clients(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_start ON public.appointments(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created ON public.sales(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_stock ON public.inventory(tenant_id, stock_level);

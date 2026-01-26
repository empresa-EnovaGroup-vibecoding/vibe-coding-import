-- Add database-level CHECK constraints for input validation
-- This prevents bypassing client-side validation by calling Supabase APIs directly

-- Clients table constraints
ALTER TABLE public.clients 
ADD CONSTRAINT clients_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT clients_name_max_length CHECK (length(name) <= 255),
ADD CONSTRAINT clients_email_max_length CHECK (email IS NULL OR length(email) <= 320),
ADD CONSTRAINT clients_phone_max_length CHECK (phone IS NULL OR length(phone) <= 50),
ADD CONSTRAINT clients_notes_max_length CHECK (notes IS NULL OR length(notes) <= 5000);

-- Services table constraints
ALTER TABLE public.services
ADD CONSTRAINT services_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT services_name_max_length CHECK (length(name) <= 255),
ADD CONSTRAINT services_price_non_negative CHECK (price >= 0),
ADD CONSTRAINT services_duration_valid CHECK (duration > 0 AND duration <= 1440);

-- Inventory table constraints
ALTER TABLE public.inventory
ADD CONSTRAINT inventory_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT inventory_name_max_length CHECK (length(name) <= 255),
ADD CONSTRAINT inventory_stock_non_negative CHECK (stock_level >= 0),
ADD CONSTRAINT inventory_cost_price_non_negative CHECK (cost_price >= 0),
ADD CONSTRAINT inventory_sale_price_non_negative CHECK (sale_price >= 0),
ADD CONSTRAINT inventory_sku_max_length CHECK (sku IS NULL OR length(sku) <= 100),
ADD CONSTRAINT inventory_supplier_max_length CHECK (supplier IS NULL OR length(supplier) <= 255);

-- Sales table constraints
ALTER TABLE public.sales
ADD CONSTRAINT sales_total_amount_non_negative CHECK (total_amount >= 0),
ADD CONSTRAINT sales_notes_max_length CHECK (notes IS NULL OR length(notes) <= 5000);

-- Sale items table constraints
ALTER TABLE public.sale_items
ADD CONSTRAINT sale_items_item_name_not_empty CHECK (length(trim(item_name)) > 0),
ADD CONSTRAINT sale_items_item_name_max_length CHECK (length(item_name) <= 255),
ADD CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT sale_items_unit_price_non_negative CHECK (unit_price >= 0),
ADD CONSTRAINT sale_items_subtotal_non_negative CHECK (subtotal >= 0);

-- Appointments table constraints
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_notes_max_length CHECK (notes IS NULL OR length(notes) <= 5000),
ADD CONSTRAINT appointments_total_price_non_negative CHECK (total_price IS NULL OR total_price >= 0),
ADD CONSTRAINT appointments_end_after_start CHECK (end_time IS NULL OR end_time > start_time);

-- Appointment services table constraints
ALTER TABLE public.appointment_services
ADD CONSTRAINT appointment_services_price_non_negative CHECK (price_at_time >= 0);

-- Facial evaluations text field constraints
ALTER TABLE public.facial_evaluations
ADD CONSTRAINT facial_evaluations_allergy_details_max_length CHECK (allergy_details IS NULL OR length(allergy_details) <= 2000),
ADD CONSTRAINT facial_evaluations_skin_disease_details_max_length CHECK (skin_disease_details IS NULL OR length(skin_disease_details) <= 2000),
ADD CONSTRAINT facial_evaluations_medication_details_max_length CHECK (medication_details IS NULL OR length(medication_details) <= 2000),
ADD CONSTRAINT facial_evaluations_treatment_details_max_length CHECK (treatment_details IS NULL OR length(treatment_details) <= 2000),
ADD CONSTRAINT facial_evaluations_treatment_performed_max_length CHECK (treatment_performed IS NULL OR length(treatment_performed) <= 2000),
ADD CONSTRAINT facial_evaluations_skin_analysis_max_length CHECK (skin_analysis IS NULL OR length(skin_analysis) <= 5000),
ADD CONSTRAINT facial_evaluations_brands_max_length CHECK (
  (cleanser_brand IS NULL OR length(cleanser_brand) <= 255) AND
  (serum_brand IS NULL OR length(serum_brand) <= 255) AND
  (cream_brand IS NULL OR length(cream_brand) <= 255) AND
  (sunscreen_brand IS NULL OR length(sunscreen_brand) <= 255)
);

-- Profiles table constraints
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_full_name_max_length CHECK (full_name IS NULL OR length(full_name) <= 255),
ADD CONSTRAINT profiles_avatar_url_max_length CHECK (avatar_url IS NULL OR length(avatar_url) <= 2048);

-- Evaluation product recommendations constraints
ALTER TABLE public.evaluation_product_recommendations
ADD CONSTRAINT eval_prod_rec_notes_max_length CHECK (notes IS NULL OR length(notes) <= 2000);
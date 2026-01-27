-- Create a view that conditionally shows cost_price based on user role
-- Staff see NULL for cost_price, admins see the actual value
CREATE OR REPLACE VIEW public.inventory_staff_view
WITH (security_invoker = on)
AS
SELECT 
  id,
  name,
  sku,
  qr_code,
  stock_level,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN cost_price
    ELSE NULL
  END as cost_price,
  sale_price,
  supplier,
  created_at,
  updated_at
FROM public.inventory;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.inventory_staff_view IS 'Secure view that hides cost_price from non-admin users. Staff see NULL for cost_price while admins see actual values.';
-- =====================================================
-- PASO 5 DE 5: AGREGARTE COMO SUPER ADMIN
-- Copia TODO este bloque y pegalo en el SQL Editor de Supabase
-- Luego haz click en "Run"
-- =====================================================

-- Primero vamos a ver tu user ID (el email con el que te registraste)
-- Esto te mostrara tu ID:
SELECT id, email FROM auth.users ORDER BY created_at LIMIT 5;

-- IMPORTANTE: Despues de ver tu ID arriba, copia el ID y ejecuta esto
-- (reemplaza TU_USER_ID_AQUI con tu ID real):

-- INSERT INTO public.super_admins (user_id)
-- VALUES ('TU_USER_ID_AQUI');

-- Ejemplo (NO uses este, usa TU ID):
-- INSERT INTO public.super_admins (user_id)
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

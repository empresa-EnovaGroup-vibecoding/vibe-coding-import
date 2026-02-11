
-- Add subscription fields to profiles
ALTER TABLE public.profiles
ADD COLUMN subscription_status text NOT NULL DEFAULT 'trial',
ADD COLUMN trial_ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days');

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

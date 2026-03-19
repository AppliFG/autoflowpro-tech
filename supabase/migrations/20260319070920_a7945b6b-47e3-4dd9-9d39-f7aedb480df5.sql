
-- Backfill: assign admin role to any existing users who don't have a role yet
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id);

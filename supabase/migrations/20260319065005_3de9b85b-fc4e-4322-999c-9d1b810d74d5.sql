
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  siret text,
  logo_url text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  install_date timestamp with time zone NOT NULL DEFAULT now(),
  subscription_active boolean NOT NULL DEFAULT false,
  subscription_plan text,
  subscription_started_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Only the dev/super-admin can see all agencies
CREATE POLICY "Admins can read all agencies"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert agencies"
  ON public.agencies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update agencies"
  ON public.agencies FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agencies"
  ON public.agencies FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

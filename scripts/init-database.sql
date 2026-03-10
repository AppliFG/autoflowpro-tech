-- ============================================================
-- AutoFlow Pro — Script d'initialisation complet
-- À exécuter sur un nouveau projet Supabase vierge
-- ============================================================

-- ============================================================
-- 1. TYPES & ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'commercial', 'comptable');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- App settings (agence config, onboarding, templates...)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  version text,
  year integer,
  mileage integer,
  fuel_type text,
  color text,
  purchase_price numeric DEFAULT 0,
  selling_price numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'En stock',
  description text,
  photo_url text,
  police_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Vehicle works (interventions)
CREATE TABLE public.vehicle_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  designation text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  client_visible boolean NOT NULL DEFAULT true,
  intervention_date date,
  intervention_km integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vehicle events (agenda)
CREATE TABLE public.vehicle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  client_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prospects (CRM)
CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  vehicle_interest text,
  notes text,
  status text NOT NULL DEFAULT 'Nouveau',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  telegram text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Quotes (devis fournisseurs)
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Brouillon',
  total_amount numeric,
  notes text,
  photo_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Quote items
CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  article_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices (factures)
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  client_nom text NOT NULL,
  client_adresse text,
  amount numeric NOT NULL DEFAULT 0,
  deposit_amount numeric DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'En attente',
  payment_method text,
  payment_date timestamptz,
  pdf_url text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Expenses (dépenses / comptabilité)
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Divers',
  subcategory text,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  expense_date date DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual',
  supplier_name text,
  invoice_number text,
  file_url text,
  file_type text,
  telegram_file_id text,
  ai_extracted_data jsonb,
  notes text,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trade-ins (reprises véhicules)
CREATE TABLE public.trade_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  registration text NOT NULL,
  mileage integer NOT NULL,
  desired_amount numeric,
  photo_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'Nouvelle',
  notes text,
  rgpd_consent boolean NOT NULL DEFAULT false,
  rgpd_consent_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- Check user role (security definer — bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_events_updated_at BEFORE UPDATE ON public.vehicle_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_ins_updated_at BEFORE UPDATE ON public.trade_ins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_ins ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---------- user_roles ----------
CREATE POLICY "Authenticated can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---------- app_settings ----------
CREATE POLICY "Anon can read settings" ON public.app_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update settings" ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete settings" ON public.app_settings FOR DELETE TO authenticated USING (true);

-- ---------- vehicles ----------
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- ---------- vehicle_works ----------
CREATE POLICY "Authenticated can read vehicle_works" ON public.vehicle_works FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vehicle_works" ON public.vehicle_works FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicle_works" ON public.vehicle_works FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete vehicle_works" ON public.vehicle_works FOR DELETE TO authenticated USING (true);

-- ---------- vehicle_events ----------
CREATE POLICY "Authenticated can read vehicle_events" ON public.vehicle_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vehicle_events" ON public.vehicle_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicle_events" ON public.vehicle_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete vehicle_events" ON public.vehicle_events FOR DELETE TO authenticated USING (true);

-- ---------- prospects ----------
CREATE POLICY "Authenticated can read prospects" ON public.prospects FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can insert prospects" ON public.prospects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Authenticated can update prospects" ON public.prospects FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete prospects" ON public.prospects FOR DELETE TO public USING (true);

-- ---------- suppliers ----------
CREATE POLICY "Authenticated can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- ---------- quotes ----------
CREATE POLICY "Authenticated can read quotes" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update quotes" ON public.quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete quotes" ON public.quotes FOR DELETE TO authenticated USING (true);

-- ---------- quote_items ----------
CREATE POLICY "Authenticated can read quote_items" ON public.quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert quote_items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update quote_items" ON public.quote_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete quote_items" ON public.quote_items FOR DELETE TO authenticated USING (true);

-- ---------- invoices ----------
CREATE POLICY "Authenticated can read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

-- ---------- expenses ----------
CREATE POLICY "Authenticated can read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role can insert expenses" ON public.expenses FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

-- ---------- trade_ins ----------
CREATE POLICY "Anyone can submit trade_ins" ON public.trade_ins FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read trade_ins" ON public.trade_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update trade_ins" ON public.trade_ins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete trade_ins" ON public.trade_ins FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 6. STORAGE BUCKETS
-- (À exécuter via l'API Supabase ou le dashboard)
-- ============================================================
-- Les buckets suivants doivent être créés en PUBLIC :
--   • vehicle-photos
--   • quote-attachments
--   • agency-assets
--   • invoices
--   • expense-documents
--
-- Via la CLI Supabase ou l'API REST :
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('vehicle-photos', 'vehicle-photos', true),
--   ('quote-attachments', 'quote-attachments', true),
--   ('agency-assets', 'agency-assets', true),
--   ('invoices', 'invoices', true),
--   ('expense-documents', 'expense-documents', true);

-- ============================================================
-- 7. POST-INSTALLATION
-- ============================================================
-- Après avoir exécuté ce script :
--
-- 1. Créer le premier utilisateur via l'auth Supabase (signup)
--
-- 2. Lui attribuer le rôle admin :
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('<UUID_DU_USER>', 'admin');
--
-- 3. Configurer les secrets Edge Functions :
--    supabase secrets set RESEND_API_KEY=xxx
--    supabase secrets set TELEGRAM_BOT_TOKEN=xxx
--    supabase secrets set LOVABLE_API_KEY=xxx
--
-- 4. Déployer les Edge Functions :
--    supabase functions deploy extract-expense
--    supabase functions deploy generate-invoice
--    supabase functions deploy invite-user
--    supabase functions deploy send-telegram
--    supabase functions deploy telegram-webhook
--
-- 5. L'utilisateur admin sera guidé par le wizard d'onboarding
--    à sa première connexion pour configurer l'agence.
-- ============================================================


-- Fix RLS policies: replace overly permissive "true" policies with proper authenticated checks

-- ===== app_settings =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.app_settings;
CREATE POLICY "Authenticated can read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update settings" ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete settings" ON public.app_settings FOR DELETE TO authenticated USING (true);

-- ===== quote_items =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.quote_items;
CREATE POLICY "Authenticated can read quote_items" ON public.quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert quote_items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update quote_items" ON public.quote_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete quote_items" ON public.quote_items FOR DELETE TO authenticated USING (true);

-- ===== quotes =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.quotes;
CREATE POLICY "Authenticated can read quotes" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update quotes" ON public.quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete quotes" ON public.quotes FOR DELETE TO authenticated USING (true);

-- ===== suppliers =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.suppliers;
CREATE POLICY "Authenticated can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- ===== trade_ins =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.trade_ins;
DROP POLICY IF EXISTS "Public can submit trade-ins" ON public.trade_ins;
CREATE POLICY "Authenticated can read trade_ins" ON public.trade_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can submit trade_ins" ON public.trade_ins FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update trade_ins" ON public.trade_ins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete trade_ins" ON public.trade_ins FOR DELETE TO authenticated USING (true);

-- ===== vehicle_events =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.vehicle_events;
CREATE POLICY "Authenticated can read vehicle_events" ON public.vehicle_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vehicle_events" ON public.vehicle_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicle_events" ON public.vehicle_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete vehicle_events" ON public.vehicle_events FOR DELETE TO authenticated USING (true);

-- ===== vehicle_works =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.vehicle_works;
CREATE POLICY "Authenticated can read vehicle_works" ON public.vehicle_works FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vehicle_works" ON public.vehicle_works FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicle_works" ON public.vehicle_works FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete vehicle_works" ON public.vehicle_works FOR DELETE TO authenticated USING (true);

-- ===== vehicles =====
DROP POLICY IF EXISTS "Authenticated full access" ON public.vehicles;
DROP POLICY IF EXISTS "Public can view vehicles" ON public.vehicles;
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- ===== app_settings: allow anon to read for vitrine RGPD text =====
CREATE POLICY "Anon can read settings" ON public.app_settings FOR SELECT TO anon USING (true);


-- Clear all data from all public tables (order matters for FK constraints)
DELETE FROM quote_items;
DELETE FROM quotes;
DELETE FROM vehicle_works;
DELETE FROM vehicle_events;
DELETE FROM invoices;
DELETE FROM expenses;
DELETE FROM vehicles;
DELETE FROM prospects;
DELETE FROM trade_ins;
DELETE FROM connector_credentials;
DELETE FROM app_settings;

-- Delete profiles and roles for users OTHER than applibyfg@gmail.com
DELETE FROM user_roles WHERE user_id != '9d877c29-8ff8-4a66-ab4b-e84804715bdf';
DELETE FROM profiles WHERE user_id != '9d877c29-8ff8-4a66-ab4b-e84804715bdf';

-- Delete auth users other than applibyfg
DELETE FROM auth.users WHERE id != '9d877c29-8ff8-4a66-ab4b-e84804715bdf';

-- Add must_change_password flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Set flag for the dev account
UPDATE profiles SET must_change_password = true WHERE user_id = '9d877c29-8ff8-4a66-ab4b-e84804715bdf';

-- Delete agencies not owned by the dev
DELETE FROM agencies WHERE owner_user_id != '9d877c29-8ff8-4a66-ab4b-e84804715bdf' OR owner_user_id IS NULL;

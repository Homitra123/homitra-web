/*
  # Intro Offer Feature Setup

  ## Summary
  Adds support for the "First 2 Bookings at Rs. 99" introductory offer.

  ## Changes

  ### Modified Tables
  - `bookings`: Adds `is_intro_priced` boolean column (default false) to track which bookings
    were placed at the Rs. 99 introductory price. Used to count how many intro slots a user has used.

  ### New Tables
  - `feature_flags`: Single-row config table to toggle features on/off without code changes.
    - `id` (uuid, primary key)
    - `name` (text, unique) - identifier for the flag e.g. 'intro_offer'
    - `is_active` (boolean) - whether the feature is currently enabled
    - `created_at` (timestamp)

  ### Security
  - RLS enabled on `feature_flags`
  - Authenticated users can read feature flags (needed to check offer eligibility at checkout)

  ### Notes
  1. The `intro_offer` flag is inserted as active (true) by default
  2. To disable the offer, run: UPDATE feature_flags SET is_active = false WHERE name = 'intro_offer';
  3. The 2-booking limit is counted across ALL eligible services combined per user
*/

-- Add intro pricing tracker to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_intro_priced BOOLEAN DEFAULT false;

-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Seed the intro_offer flag as active
INSERT INTO feature_flags (name, is_active) VALUES ('intro_offer', true)
ON CONFLICT (name) DO NOTHING;

/*
  # Add customization_details to bookings

  ## Summary
  Adds a JSONB column to store all customer meal customisation inputs
  so admins can see exactly what each customer ordered.

  ## Changes
  - `bookings` table: new nullable `customization_details jsonb` column

  ## Details
  The column stores the full customiser state as JSON, e.g.:
  - Veg/Non-veg: people count, chosen dishes, add-ons, extra rotis
  - Bites: dish type, curated/street food selection, beverage, extras
  - Monthly: meal frequency, months, non-veg add-on, people count

  No existing rows are affected. New bookings will populate this column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customization_details'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customization_details jsonb;
  END IF;
END $$;

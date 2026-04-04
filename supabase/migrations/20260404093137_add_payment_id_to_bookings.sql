/*
  # Add payment_id column to bookings table

  1. Changes
    - Add `payment_id` column to `bookings` table to store Razorpay payment ID
    - This allows tracking which payment corresponds to which booking for audit purposes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_id text;
  END IF;
END $$;
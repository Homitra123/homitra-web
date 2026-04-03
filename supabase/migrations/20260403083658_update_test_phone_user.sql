/*
  # Update test user for phone authentication

  1. Changes
    - Updates or creates test user with email reviewer@razorpay.com
    - Sets phone number 9999999999
    - Updates profile with name 'Razorpay Reviewer'
    - Ensures phone field is set in profile

  2. Security
    - Uses existing RLS policies
    - Test user only for development purposes
*/

-- Update the handle_new_user function to handle phone field
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to ensure they have the phone field if available
DO $$
DECLARE
  test_user_record RECORD;
BEGIN
  -- Check if test user exists
  SELECT id, email, phone INTO test_user_record
  FROM auth.users
  WHERE email = 'reviewer@razorpay.com';

  IF test_user_record.id IS NOT NULL THEN
    -- Update the profile
    INSERT INTO public.profiles (id, email, full_name, phone, created_at, updated_at)
    VALUES (
      test_user_record.id,
      'reviewer@razorpay.com',
      'Razorpay Reviewer',
      '9999999999',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      full_name = 'Razorpay Reviewer',
      phone = '9999999999',
      updated_at = now();

    -- Also update auth.users to include the phone
    UPDATE auth.users
    SET 
      phone = '9999999999',
      phone_confirmed_at = now(),
      updated_at = now()
    WHERE id = test_user_record.id;
  END IF;
END $$;

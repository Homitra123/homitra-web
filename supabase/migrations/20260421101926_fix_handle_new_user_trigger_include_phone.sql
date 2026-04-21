/*
  # Fix handle_new_user trigger to include phone number

  ## Problem
  The existing trigger creates a profile row without the phone field,
  causing the profile to show "No phone number" immediately after signup
  even though the user provided one.

  ## Fix
  Update the trigger function to also read phone from raw_user_meta_data
  so the profile is created with the correct phone number from the start.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      phone     = COALESCE(EXCLUDED.phone, profiles.phone),
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

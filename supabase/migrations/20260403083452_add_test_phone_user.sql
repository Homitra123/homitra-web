/*
  # Add test user for phone authentication

  1. Changes
    - Creates a test user in auth.users with phone 9999999999
    - Creates corresponding profile with name 'Razorpay Reviewer'
    - This user can log in with phone 9999999999 and OTP 123456 (test bypass)

  2. Security
    - Uses existing RLS policies
    - Test user only for development purposes
*/

-- Insert test user into auth.users if not exists
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Check if user with this phone already exists
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE phone = '9999999999';

  -- If user doesn't exist, create it
  IF test_user_id IS NULL THEN
    -- Generate a new UUID for the test user
    test_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      phone,
      encrypted_password,
      email_confirmed_at,
      phone_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'reviewer@razorpay.com',
      '9999999999',
      crypt('test-password-' || gen_random_uuid()::text, gen_salt('bf')),
      now(),
      now(),
      '{"provider": "phone", "providers": ["phone"]}'::jsonb,
      '{"full_name": "Razorpay Reviewer"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Insert corresponding profile
    INSERT INTO public.profiles (id, email, full_name, phone, created_at, updated_at)
    VALUES (
      test_user_id,
      'reviewer@razorpay.com',
      'Razorpay Reviewer',
      '9999999999',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      phone = EXCLUDED.phone,
      full_name = EXCLUDED.full_name,
      updated_at = now();
  ELSE
    -- Update existing profile to ensure it has the correct name
    UPDATE public.profiles
    SET 
      full_name = 'Razorpay Reviewer',
      phone = '9999999999',
      updated_at = now()
    WHERE id = test_user_id;
  END IF;
END $$;

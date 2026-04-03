/*
  # Fix test phone user password

  1. Changes
    - Updates the password for reviewer@razorpay.com user
    - Sets a known password for testing phone authentication
    - Ensures the user can be authenticated via signInWithPassword

  2. Security
    - Test user only for development purposes
*/

-- Update the password for the test user
DO $$
BEGIN
  UPDATE auth.users
  SET 
    encrypted_password = crypt('razorpay-test-2024', gen_salt('bf')),
    updated_at = now()
  WHERE email = 'reviewer@razorpay.com';
END $$;

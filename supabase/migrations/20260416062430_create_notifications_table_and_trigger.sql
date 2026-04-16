
/*
  # Create notifications table and booking status change trigger

  ## Summary
  This migration creates a notifications system that automatically records
  an entry whenever a booking's status is changed by the admin.

  ## New Tables
  - `notifications`
    - `id` (uuid, primary key)
    - `user_id` (uuid) - the customer who owns the booking
    - `booking_id` (uuid) - reference to the booking
    - `type` (text) - notification type, e.g. 'status_change'
    - `title` (text) - short heading shown in notification
    - `message` (text) - full description of what changed
    - `old_status` (text) - what the status was before
    - `new_status` (text) - what the status changed to
    - `is_read` (boolean, default false) - whether customer has seen it
    - `created_at` (timestamptz)

  ## Trigger
  - `notify_on_booking_status_change` fires AFTER UPDATE on bookings
  - Only activates when the status column value actually changes
  - Inserts a notification record for the booking owner automatically

  ## Security
  - RLS enabled on notifications table
  - Customers can only read their own notifications
  - Customers can update their own notifications (to mark as read)
  - No insert/delete allowed from client side (trigger handles inserts)
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'status_change',
  title text NOT NULL,
  message text NOT NULL,
  old_status text,
  new_status text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_title text;
  v_message text;
  v_service_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_service_name := COALESCE(NEW.service_name, 'Your service');

    IF NEW.status = 'confirmed' THEN
      v_title := 'Booking Confirmed';
      v_message := v_service_name || ' booking has been confirmed. We look forward to serving you!';
    ELSIF NEW.status = 'completed' THEN
      v_title := 'Service Completed';
      v_message := v_service_name || ' has been marked as completed. Thank you for choosing Homitra!';
    ELSIF NEW.status = 'cancelled' THEN
      v_title := 'Booking Cancelled';
      v_message := v_service_name || ' booking has been cancelled. Please contact us if you have any questions.';
    ELSE
      v_title := 'Booking Update';
      v_message := v_service_name || ' booking status has been updated to ' || NEW.status || '.';
    END IF;

    INSERT INTO notifications (user_id, booking_id, type, title, message, old_status, new_status)
    VALUES (NEW.user_id, NEW.id, 'status_change', v_title, v_message, OLD.status, NEW.status);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_on_booking_status_change ON bookings;

CREATE TRIGGER notify_on_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_status_change();

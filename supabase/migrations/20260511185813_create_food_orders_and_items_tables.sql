/*
  # Create food_orders and food_order_items tables

  ## Summary
  This migration sets up the Cloud Kitchen ordering system for Homitra Food Services.

  ## New Tables

  ### food_orders
  - `id` (uuid, primary key) — unique order identifier
  - `user_id` (uuid, FK to auth.users) — who placed the order
  - `location` (text) — delivery area/neighbourhood
  - `address` (text) — full delivery address
  - `special_instructions` (text) — optional cooking/delivery notes
  - `subtotal` (numeric) — cart total before delivery fee
  - `delivery_fee` (numeric, default 0) — always 0 (free delivery)
  - `total_amount` (numeric) — final payable amount
  - `payment_method` (text) — 'cod' or 'online'
  - `payment_id` (text, nullable) — Razorpay payment ID for online orders
  - `status` (text, default 'confirmed') — confirmed | cancelled | completed
  - `estimated_delivery_minutes` (integer, default 45)
  - `created_at` / `updated_at` (timestamptz)

  ### food_order_items
  - `id` (uuid, primary key)
  - `order_id` (uuid, FK to food_orders) — parent order
  - `item_id` (text) — reference key from menu data
  - `item_name` (text) — snapshot of item name at time of order
  - `item_category` (text) — e.g. "Biryani", "Starters"
  - `quantity` (integer)
  - `unit_price` (numeric) — price per item at time of order
  - `total_price` (numeric) — quantity × unit_price
  - `is_veg` (boolean)

  ## Security
  - RLS enabled on both tables
  - Users can only read/insert their own orders and order items
  - Service role has full access for edge function use

  ## Indexes
  - food_orders: user_id, status
  - food_order_items: order_id
*/

-- food_orders table
CREATE TABLE IF NOT EXISTS food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  location text NOT NULL,
  address text NOT NULL,
  special_instructions text DEFAULT '',
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_id text DEFAULT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  estimated_delivery_minutes integer NOT NULL DEFAULT 45,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own food orders"
  ON food_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food orders"
  ON food_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can select all food orders"
  ON food_orders FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert food orders"
  ON food_orders FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update food orders"
  ON food_orders FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS food_orders_user_id_idx ON food_orders(user_id);
CREATE INDEX IF NOT EXISTS food_orders_status_idx ON food_orders(status);

-- food_order_items table
CREATE TABLE IF NOT EXISTS food_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_category text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  is_veg boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON food_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_orders
      WHERE food_orders.id = food_order_items.order_id
      AND food_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON food_order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_orders
      WHERE food_orders.id = food_order_items.order_id
      AND food_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can select all order items"
  ON food_order_items FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert order items"
  ON food_order_items FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS food_order_items_order_id_idx ON food_order_items(order_id);

-- updated_at trigger for food_orders
CREATE OR REPLACE FUNCTION update_food_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS food_orders_updated_at ON food_orders;
CREATE TRIGGER food_orders_updated_at
  BEFORE UPDATE ON food_orders
  FOR EACH ROW EXECUTE FUNCTION update_food_orders_updated_at();

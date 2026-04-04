import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`Supabase URL must use HTTPS for security. Received: ${supabaseUrl}`);
}

console.log('Supabase client initialized with URL:', supabaseUrl);
console.log('Using ANON key:', supabaseAnonKey.substring(0, 20) + '...');

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  tier: string;
  booking_mode: string;
  duration: string;
  date: string;
  dates: string[];
  weekdays: string[];
  time_slot: string;
  flexible_bookings?: any;
  location: string;
  address: string;
  price: number;
  visits: number;
  status: string;
  partner_name: string | null;
  created_at: string;
  updated_at: string;
}

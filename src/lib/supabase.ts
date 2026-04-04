import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!rawUrl || !rawKey) {
  throw new Error('Missing Supabase environment variables. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
}

const sanitizedUrl = rawUrl.startsWith('http://')
  ? rawUrl.replace('http://', 'https://')
  : rawUrl;

if (!sanitizedUrl.startsWith('https://')) {
  throw new Error(`Insecure URL detected. Supabase URL must use HTTPS. Received: ${sanitizedUrl}`);
}

if (sanitizedUrl.includes(':54321') || sanitizedUrl.includes('localhost') || sanitizedUrl.includes('127.0.0.1')) {
  throw new Error(`Local development URL detected. Production requires remote HTTPS URL. Received: ${sanitizedUrl}`);
}

const finalUrl = sanitizedUrl.replace(/:\d+$/, '');

console.log('Supabase client initialized with sanitized URL:', finalUrl);
console.log('Using ANON key:', rawKey.substring(0, 20) + '...');

export const supabase = createClient(
  finalUrl,
  rawKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: window.fetch.bind(window),
      headers: {},
    },
  }
);

export const getSupabaseUrl = () => finalUrl;

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

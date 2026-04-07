import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('[Supabase] Client initialized with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'homitra-auth-token',
    storage: window.localStorage,
  },
  global: {
    headers: {
      'X-Client-Info': 'homitra-web-app',
    },
  },
});

export const getSupabaseUrl = () => {
  if (supabaseUrl.startsWith('http://')) {
    console.warn('[Supabase] WARNING: URL is HTTP, forcing HTTPS');
    return supabaseUrl.replace('http://', 'https://');
  }
  if (!supabaseUrl.startsWith('https://')) {
    console.warn('[Supabase] WARNING: URL missing protocol, adding HTTPS');
    return `https://${supabaseUrl}`;
  }
  return supabaseUrl;
};

export const getSupabaseAnonKey = () => supabaseAnonKey;

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  timeoutError: string = 'Request timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    ),
  ]);
};

export async function fetchWithNativeFallback(
  table: string,
  userId: string,
  accessToken: string
): Promise<any[]>;

export async function fetchWithNativeFallback(
  url: string,
  options: RequestInit
): Promise<Response>;

export async function fetchWithNativeFallback(
  tableOrUrl: string,
  userIdOrOptions: string | RequestInit,
  accessToken?: string
): Promise<any[] | Response> {
  const url = getSupabaseUrl();
  const apikey = getSupabaseAnonKey();

  if (typeof userIdOrOptions === 'string' && accessToken) {
    console.log(`[Fallback] Using native fetch for table ${tableOrUrl}`);

    const fetchUrl = `${url}/rest/v1/${tableOrUrl}?user_id=eq.${userIdOrOptions}&order=created_at.desc`;

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Fallback fetch failed: ${response.status}`);
    }

    return response.json();
  } else {
    console.log(`[Fallback] Using native fetch for URL: ${tableOrUrl}`);

    const options = userIdOrOptions as RequestInit;
    const response = await fetch(tableOrUrl, {
      ...options,
      credentials: 'omit',
    });

    return response;
  }
}

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

import { createClient } from '@supabase/supabase-js';

const HARDCODED_URL = 'https://talcyiifgehpcphwotej.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbGN5aWlmZ2VocGNwaHdvdGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDIzNTksImV4cCI6MjA5MDY3ODM1OX0.fkq4NgKspCK5xoYakoEK93XCTxj1CYUeR845quadapc';

console.log('[Supabase] Client initialized with hardcoded production URL:', HARDCODED_URL);
console.log('[Supabase] Using ANON key:', HARDCODED_KEY.substring(0, 20) + '...');

export const supabase = createClient(
  HARDCODED_URL,
  HARDCODED_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'homitra-auth-token',
      storage: window.localStorage,
    },
    global: {
      fetch: window.fetch.bind(window),
      headers: {
        'X-Client-Info': 'homitra-web-app',
      },
    },
  }
);

export const getSupabaseUrl = () => HARDCODED_URL;
export const getSupabaseAnonKey = () => HARDCODED_KEY;

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
  if (typeof userIdOrOptions === 'string' && accessToken) {
    console.log(`[Fallback] Using native fetch for table ${tableOrUrl}`);

    const url = `${HARDCODED_URL}/rest/v1/${tableOrUrl}?user_id=eq.${userIdOrOptions}&order=created_at.desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': HARDCODED_KEY,
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

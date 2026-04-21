const KEY = 'homitra_pending_booking';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface PendingBooking {
  bookingData: Record<string, unknown>;
  serviceRoute: string;
  timestamp: number;
}

export const savePendingBooking = (bookingData: Record<string, unknown>, serviceRoute: string): void => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ bookingData, serviceRoute, timestamp: Date.now() }));
  } catch {}
};

export const getPendingBooking = (): PendingBooking | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingBooking;
    if (Date.now() - parsed.timestamp > TTL_MS) {
      clearPendingBooking();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingBooking = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
};

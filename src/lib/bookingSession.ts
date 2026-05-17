const KEY = 'homitra_pending_booking';
const DRAFT_PREFIX = 'homitra_booking_draft_';
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

// --- Booking draft (preserves customization state across navigation) ---

export const saveBookingDraft = (serviceId: string, draft: Record<string, unknown>): void => {
  try {
    sessionStorage.setItem(DRAFT_PREFIX + serviceId, JSON.stringify({ draft, timestamp: Date.now() }));
  } catch {}
};

export const getBookingDraft = (serviceId: string): Record<string, unknown> | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_PREFIX + serviceId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { draft: Record<string, unknown>; timestamp: number };
    if (Date.now() - parsed.timestamp > TTL_MS) {
      clearBookingDraft(serviceId);
      return null;
    }
    return parsed.draft;
  } catch {
    return null;
  }
};

export const clearBookingDraft = (serviceId: string): void => {
  try {
    sessionStorage.removeItem(DRAFT_PREFIX + serviceId);
  } catch {}
};

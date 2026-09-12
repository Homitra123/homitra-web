// Shared helpers for the Homitra admin console.
// Keep formatting + status styling in one place so every page is consistent.

export const formatINR = (n: number | string | null | undefined): string => {
  const num = Number(n || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const timeAgo = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export const isToday = (iso: string | null | undefined): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

// Normalised status → tailwind pill classes + readable label.
export const statusStyle = (
  status: string | null | undefined
): { classes: string; label: string } => {
  const s = (status || '').toLowerCase();
  const map: Record<string, { classes: string; label: string }> = {
    pending: { classes: 'bg-amber-50 text-amber-700 ring-amber-600/20', label: 'Pending' },
    confirmed: { classes: 'bg-sky-50 text-sky-700 ring-sky-600/20', label: 'Confirmed' },
    active: { classes: 'bg-blue-50 text-blue-700 ring-blue-600/20', label: 'Active' },
    in_progress: { classes: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', label: 'In progress' },
    completed: { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', label: 'Completed' },
    delivered: { classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', label: 'Delivered' },
    cancelled: { classes: 'bg-rose-50 text-rose-700 ring-rose-600/20', label: 'Cancelled' },
  };
  return (
    map[s] || {
      classes: 'bg-slate-100 text-slate-600 ring-slate-500/20',
      label: status ? status.replace(/_/g, ' ') : 'Unknown',
    }
  );
};

// An "open" order/booking is one that still needs operator attention.
export const OPEN_BOOKING_STATUSES = ['pending', 'confirmed', 'active', 'in_progress'];
export const OPEN_ORDER_STATUSES = ['confirmed'];

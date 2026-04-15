function parseSlotTime(slot: string, referenceDate: Date): Date {
  const [time, period] = slot.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const result = new Date(referenceDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isTimeSlotDisabled(slot: string, bookingDate?: Date | string): boolean {
  const now = new Date();
  let target: Date;

  if (!bookingDate) {
    target = now;
  } else if (typeof bookingDate === 'string') {
    const [year, month, day] = bookingDate.split('-').map(Number);
    target = new Date(year, month - 1, day);
  } else {
    target = bookingDate;
  }

  if (!isSameDay(target, now)) return false;

  const slotTime = parseSlotTime(slot, now);
  const minAllowed = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return slotTime < minAllowed;
}

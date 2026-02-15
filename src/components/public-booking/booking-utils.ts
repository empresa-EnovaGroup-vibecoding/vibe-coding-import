interface BookedSlot {
  start_time: string;
  end_time: string;
}

export const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function generateTimeSlots(
  open: string,
  close: string,
  durationMin: number,
  booked: BookedSlot[],
  selectedDate: string
): string[] {
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;
  const slots: string[] = [];

  for (let t = openTotal; t + durationMin <= closeTotal; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    const slotStart = new Date(`${selectedDate}T${hh}:${mm}:00`);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    const hasConflict = booked.some((b) => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!hasConflict) {
      slots.push(`${hh}:${mm}`);
    }
  }

  // Filter out past times if date is today
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (selectedDate === today) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((s) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m > currentMinutes + 30; // at least 30 min from now
    });
  }

  return slots;
}

/** Date and time formatting, always in India Standard Time regardless of the guest's device. */
const TZ = 'Asia/Kolkata';

const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });

type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;
const parts = (fmt: Intl.DateTimeFormat, iso: string): Parts =>
  Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));

/** "Wednesday, 7 April 2027" */
export function formatDateLong(iso: string): string {
  const p = parts(dateFmt, iso);
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

/** "Wed, 7 Apr 2027" */
export function formatDateShort(iso: string): string {
  const p = parts(shortFmt, iso);
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

/** "10:30 AM" (append " IST" where needed) */
export function formatTime(iso: string): string {
  const p = parts(timeFmt, iso);
  return `${p.hour}:${p.minute} ${p.dayPeriod?.toUpperCase()}`;
}

/** { day: "07", month: "APRIL", year: "2027", weekday: "Wednesday" } for the Save the Date panels */
export function dateParts(iso: string) {
  const p = parts(dateFmt, iso);
  return { day: p.day!.padStart(2, '0'), month: p.month!.toUpperCase(), year: p.year!, weekday: p.weekday! };
}

/** "+91 98765 43210" for Indian mobiles; other numbers keep their stored international form. */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

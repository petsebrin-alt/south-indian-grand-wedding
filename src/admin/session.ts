/**
 * Family admin sign-in (PRD §13.6): Supabase Auth magic links over its REST API, so the page needs
 * no SDK. Only people added as users in Supabase can request a link, and the admin functions also
 * check the email against the admin list. In development a local sign-in stands in for the email.
 */
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
const KEY = 'rdv:admin-session';

export const devSignIn = import.meta.env.DEV;
// Only the dev server accepts this token; it is compiled out of production builds.
export const DEV_TOKEN = import.meta.env.DEV ? 'dev-admin' : '';
export const emailSignIn = !!SUPABASE_URL && !!ANON_KEY;

interface Session {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

const read = (): Session | null => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Session | null;
  } catch {
    return null;
  }
};
const write = (s: Session | null) => {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode: the session lasts only for this page */
  }
};

const authHeaders = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' };

/** Pick up the tokens a magic link returns in the URL fragment, then remove them from the address bar. */
export function takeRedirect(): { error: string | null } {
  if (!location.hash.includes('access_token=') && !location.hash.includes('error')) return { error: null };
  const params = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', location.pathname + location.search);
  const error = params.get('error_description');
  if (error) return { error: error.replace(/\+/g, ' ') };
  const accessToken = params.get('access_token');
  if (accessToken) write({ accessToken, refreshToken: params.get('refresh_token'), expiresAt: Date.now() + Number(params.get('expires_in') ?? 3600) * 1000 });
  return { error: null };
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
  const redirect = location.origin + location.pathname;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ email, create_user: false }),
    });
    if (res.ok) return { ok: true, message: `A sign-in link is on its way to ${email}. Open it on this device.` };
    if (res.status === 429) return { ok: false, message: 'Too many sign-in emails were requested. Please wait a few minutes.' };
    return { ok: false, message: 'This email is not on the family list. Please ask the site owner to add it.' };
  } catch {
    return { ok: false, message: 'We could not reach the sign-in service. Please check your connection.' };
  }
}

export function signInForDevelopment() {
  if (!devSignIn) return;
  write({ accessToken: DEV_TOKEN, refreshToken: null, expiresAt: Number.MAX_SAFE_INTEGER });
}

export const signOut = () => write(null);
export const hasSession = () => !!read();

/** A valid access token, refreshed shortly before it expires; null when signed out. */
export async function accessToken(): Promise<string | null> {
  const s = read();
  if (!s) return null;
  if (s.expiresAt - Date.now() > 60_000) return s.accessToken;
  if (!s.refreshToken) {
    write(null);
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ refresh_token: s.refreshToken }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
    const next = { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 };
    write(next);
    return next.accessToken;
  } catch {
    write(null);
    return null;
  }
}

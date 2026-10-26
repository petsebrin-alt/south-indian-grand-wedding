/**
 * Invisible bot challenge (Cloudflare Turnstile, PRD §13.5), loaded only when
 * PUBLIC_TURNSTILE_SITE_KEY is configured. Returns null when it is not configured.
 */
interface Turnstile {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  execute(id: string): void;
  reset(id: string): void;
}

const SITE_KEY: string | undefined = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
let loading: Promise<Turnstile> | null = null;

function load(): Promise<Turnstile> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve((window as unknown as { turnstile: Turnstile }).turnstile);
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.append(script);
  });
  return loading;
}

export async function getBotToken(container: HTMLElement): Promise<string | null> {
  if (!SITE_KEY) return null;
  try {
    const turnstile = await load();
    return await new Promise<string | null>((resolve) => {
      container.replaceChildren();
      const id = turnstile.render(container, {
        sitekey: SITE_KEY,
        size: 'invisible',
        execution: 'execute',
        callback: (token: string) => resolve(token),
        'error-callback': () => resolve(null),
      });
      turnstile.execute(id);
    });
  } catch {
    return null;
  }
}

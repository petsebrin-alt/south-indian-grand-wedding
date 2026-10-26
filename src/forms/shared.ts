/** Small helpers shared by the Wishing Wall and RSVP forms. */

export const store = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode: drafts simply are not kept */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** Show field errors next to their inputs (aria-invalid + aria-describedby); focus the first. */
export function showErrors(form: HTMLElement, errors: Record<string, string>, focus = true) {
  let first: HTMLElement | null = null;
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((el) => {
    const name = el.dataset.errorFor!;
    el.textContent = errors[name] ?? '';
    const control = form.querySelector<HTMLElement>(`[name="${name}"]`);
    if (control) control.setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
    if (errors[name] && !first) first = control ?? el;
  });
  if (focus) (first as HTMLElement | null)?.focus();
}

export function clearError(form: HTMLElement, name: string) {
  const el = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (el) el.textContent = '';
  form.querySelector(`[name="${name}"]`)?.setAttribute('aria-invalid', 'false');
}

export function setSending(button: HTMLButtonElement, sending: boolean) {
  button.classList.toggle('is-sending', sending);
  button.disabled = sending;
  button.setAttribute('aria-busy', String(sending));
}

/** Wait until at least `ms` have passed since `since` (the server rejects forms filled implausibly fast). */
export const atLeast = (since: number, ms: number) => new Promise<void>((r) => setTimeout(r, Math.max(0, ms - (performance.now() - since))));

export function liveCounter(input: HTMLTextAreaElement | HTMLInputElement, out: HTMLElement | null, max: number) {
  const update = () => out && (out.textContent = `${input.value.length} / ${max}`);
  input.addEventListener('input', update);
  update();
  return update;
}

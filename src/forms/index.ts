import { apiAvailable, errorMessage } from '../lib/api';
import { initRsvp } from './rsvp';
import { initWishes } from './wishes';

/**
 * Guest forms (PRD §6.15–§6.16). Without a configured API (a static preview build) their buttons
 * stay visible but explain on tap that the feature opens soon, rather than accepting input that
 * could never be saved.
 */
export function initForms() {
  if (!apiAvailable)
    document.querySelectorAll<HTMLElement>('[data-needs-api]').forEach((b) => {
      b.setAttribute('aria-disabled', 'true');
      b.dataset.disabledMessage = errorMessage('unavailable', b.dataset.needsApi === 'RSVP' ? 'RSVP' : 'blessing');
    });
  initWishes();
  initRsvp();
}

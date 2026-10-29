import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';
import { startCelebration } from '../celebrate';

/**
 * Wedding Ceremony (PRD §6.10), on the client's real mandapam picture: over a soft glow of the hall,
 * the beam, then the pillars, drop in from above, one after another; the mango toran lowers; the
 * jasmine garlands unroll one by one; the little lamps, banana plants, standing lamps and floor arrive;
 * the board lowers on its garlands, the hall comes into focus, the two cone crackers appear on the
 * floor and the board's lines follow, ending on the blinking Accept button and its tapping hand.
 * Accepting turns the button to "Accepted" and sets off the celebration (src/motion/celebrate.ts); at the
 * same moment the board's lines float up and away, then the couple from the first page appear with
 * their thanks, and last a "Return to RSVP" button. That button does not turn the page: it sends the thanks
 * away and brings the invitation back, with its Accept button ready to be tapped again. Accepting is
 * remembered on this device (a returning guest sees the thanks at once) until the guest returns. It does
 * not store an RSVP: that is the RSVP page's form.
 */
const KEY = 'rdv:accepted';
const remembered = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* private mode: it lasts for this visit */
  }
};

const forget = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
};

defineChoreo('ceremony', (page) => {
  const q = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
  const piece = (name: string) => q(`.cm__piece--${name}`);
  let celebration: ReturnType<typeof startCelebration> | null = null;

  const choreo = timelineChoreo((tl) => {
    tl.from(q('.cm__base'), { opacity: 0, duration: 0.5 }, 0)
      .from(piece('beam'), { yPercent: -34, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.15)
      .from(piece('pillar'), { yPercent: -14, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.16 }, 0.35)
      .from(piece('toran'), { yPercent: -30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.85)
      .from(piece('strand'), { clipPath: 'inset(0 0 100% 0)', yPercent: -6, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, 1.0)
      .from(piece('hang'), { yPercent: -22, opacity: 0, duration: 0.55, stagger: 0.08 }, 1.8)
      .from(piece('banana'), { opacity: 0, scale: 0.86, yPercent: 5, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)' }, 1.95)
      .from(piece('lamp'), { opacity: 0, yPercent: 5, duration: 0.5, stagger: 0.08 }, 2.15)
      .from(piece('floor'), { opacity: 0, yPercent: 3, duration: 0.6 }, 2.2)
      .from(piece('board'), { scaleY: 0.12, opacity: 0, transformOrigin: '50% 0%', duration: 0.75, ease: 'power3.out' }, 2.45)
      .from(q('.cm__rest'), { opacity: 0, duration: 0.8 }, 2.85)
      .from(q('.cm__cracker'), { opacity: 0, scale: 0.6, transformOrigin: '50% 100%', duration: 0.45, stagger: 0.12, ease: 'back.out(2)' }, 3.1)
      .from(q('.cm__line'), { opacity: 0, y: 6, duration: 0.45, stagger: 0.09 }, 2.9)
      .from(q('.cm__lotus'), { opacity: 0, scale: 0.7, duration: 0.5 }, 2.9);
  })(page);

  const button = page.querySelector<HTMLButtonElement>('[data-accept]')!;
  const label = page.querySelector<HTMLElement>('[data-accept-text]')!;
  const lines = q('.cm__invite .cm__line, .cm__invite .cm__lotus');
  const parts = q('[data-thanks-part]');
  const link = page.querySelector<HTMLElement>('[data-return]')!;
  let thanksTimeline: gsap.core.Timeline | null = null;

  const showAccepted = () => {
    page.classList.add('is-accepted');
    label.textContent = 'Accepted';
    button.setAttribute('aria-label', 'Accepted. Thank you. Tap to celebrate again.');
  };
  /** The thanks in place of the invitation, with nothing moving */
  const showThanks = () => {
    thanksTimeline?.kill();
    page.classList.add('is-thanks');
    gsap.set([...lines, ...parts, link], { clearProps: 'all' });
  };
  /** The lines float up and away while the button is accepted, then the couple and their thanks arrive */
  const playThanks = () => {
    if (page.classList.contains('is-thanks')) return;
    if (isReducedMotion()) return showThanks();
    thanksTimeline?.kill();
    thanksTimeline = gsap
      .timeline()
      .to(lines, { y: -26, opacity: 0, duration: 0.6, ease: 'power2.in', stagger: 0.07 }, 0)
      .add(() => {
        page.classList.add('is-thanks');
        gsap.set([...lines], { clearProps: 'all' });
      }, 0.95)
      .from(parts[0], { scale: 0.55, opacity: 0, y: 18, duration: 0.8, ease: 'back.out(1.6)' }, 1)
      .from(parts.slice(1), { opacity: 0, y: 10, duration: 0.55, stagger: 0.28, ease: 'power2.out' }, 1.5)
      .from(link, { opacity: 0, y: 8, duration: 0.5 }, 2.9);
  };

  /** Back to the invitation: the thanks go, the lines come back, and Accept is ready to be tapped again */
  const playReturn = () => {
    celebration?.stop();
    celebration = null;
    forget();
    thanksTimeline?.kill();
    const back = () => {
      page.classList.remove('is-thanks', 'is-accepted');
      label.textContent = 'Accept the Invitation';
      button.removeAttribute('aria-label');
      gsap.set([...parts, link], { clearProps: 'all' });
    };
    if (isReducedMotion()) return back();
    thanksTimeline = gsap
      .timeline()
      .to([...parts, link], { y: 16, opacity: 0, duration: 0.45, ease: 'power2.in', stagger: 0.05 }, 0)
      .add(() => {
        back();
        gsap.from(lines, { y: 14, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08, clearProps: 'all' });
      }, 0.6);
  };
  link.addEventListener('click', playReturn);

  button.addEventListener('click', () => {
    celebration?.stop();
    remember();
    showAccepted();
    celebration = startCelebration(page);
    playThanks();
  });
  if (remembered()) {
    showAccepted();
    showThanks();
  }

  return {
    enter(animate) {
      choreo.enter(animate);
    },
    leave() {
      celebration?.stop();
      celebration = null;
      if (page.classList.contains('is-accepted')) showThanks();
    },
  };
});

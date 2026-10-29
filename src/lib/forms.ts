/** Small helpers shared by every account form. Messages are always set with textContent. */

export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function value(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name) as HTMLInputElement | null;
  return (el?.value ?? '').trim();
}

export function setError(form: HTMLElement, name: string, message = ''): void {
  const slot = form.querySelector<HTMLElement>(`[data-error="${name}"]`);
  if (!slot) return;
  slot.textContent = message;
  slot.closest('.field')?.classList.toggle('invalid', Boolean(message));
}

export function clearErrors(form: HTMLElement): void {
  form.querySelectorAll<HTMLElement>('[data-error]').forEach((slot) => {
    slot.textContent = '';
    slot.closest('.field')?.classList.remove('invalid');
  });
}

export function say(target: HTMLElement | null, kind: 'ok' | 'error' | '', message = ''): void {
  if (!target) return;
  target.dataset.kind = kind;
  target.textContent = message;
}

export function busy(button: HTMLButtonElement, on: boolean): void {
  button.disabled = on;
}

/** Validate; focuses the first invalid control. `rules` returns [field, message] pairs for every failure. */
export function check(form: HTMLFormElement, rules: () => [string, string][]): boolean {
  clearErrors(form);
  const failures = rules();
  failures.forEach(([name, message]) => setError(form, name, message));
  if (failures.length) {
    (form.elements.namedItem(failures[0][0]) as HTMLElement | null)?.focus();
  }
  return failures.length === 0;
}

export const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'medium' }).format(new Date(iso));

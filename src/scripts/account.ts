import { $, el, storage } from '../lib/dom';
import {
  arabicError, cancelEnrollment, enrollmentTitle, enroll, fetchCertificates, fetchEnrollments, fetchProfile,
  requireSession, signOut, statusLabel, updateProfile, WORKSHOP_REF, WORKSHOP_TITLE,
  type Enrollment, type Profile,
} from '../lib/accounts';
import { PENDING_KEY, readPending, type PendingEnrollment } from '../lib/pending';
import { busy, check, fmtDate, say, value } from '../lib/forms';
import { tracks } from '../data/tracks';

const root = $('[data-account]');
if (root) void start(root);

async function start(root: HTMLElement) {
  const session = await requireSession();
  if (!session) return;
  const uid = session.user.id;
  const errorBox = $('#acc-error', root);

  try {
    await applyPending(uid);
    const profile = await fetchProfile(uid);
    renderHeader(profile);
    fillProfile(profile);
    await renderEnrollments(uid);
    await renderCertificates(uid);
  } catch (e) {
    say(errorBox, 'error', arabicError(e as Error));
  }

  $('#acc-loading')!.hidden = true;
  root.hidden = false;

  $('#acc-out', root)!.addEventListener('click', () => void signOut());
  wireProfileForm(uid);
  wireAdd(uid);

  // ---- helpers ------------------------------------------------------------
  function renderHeader(p: Profile) {
    $('#acc-hello', root)!.textContent = `أهلاً ${p.full_name.split(/\s+/)[0] || ''}`.trim();
    $('#acc-email', root)!.textContent = p.email;
    if (p.role === 'admin') $('#acc-admin', root)!.hidden = false;
  }

  function fillProfile(p: Profile) {
    const form = $<HTMLFormElement>('#acc-profile', root)!;
    for (const key of ['full_name', 'phone', 'city', 'status', 'major', 'year'] as const) {
      (form.elements.namedItem(key) as HTMLInputElement).value = p[key];
    }
  }

  function wireProfileForm(userId: string) {
    const form = $<HTMLFormElement>('#acc-profile', root)!;
    const msg = $('#acc-profile-msg', root);
    const save = $<HTMLButtonElement>('#acc-save', root)!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = check(form, () => {
        const bad: [string, string][] = [];
        if (value(form, 'full_name').split(/\s+/).filter(Boolean).length < 2) bad.push(['full_name', 'اكتب اسمك الكامل (اسمان على الأقل)']);
        if (value(form, 'phone').replace(/\D/g, '').length < 8) bad.push(['phone', 'اكتب رقم جوال صحيح مع رمز الدولة']);
        if (!value(form, 'status')) bad.push(['status', 'اختر وضعك الحالي']);
        if (!value(form, 'major')) bad.push(['major', 'اختر تخصصك الدراسي']);
        return bad;
      });
      if (!ok) return;
      busy(save, true);
      try {
        await updateProfile(userId, {
          full_name: value(form, 'full_name'), phone: value(form, 'phone'), city: value(form, 'city'),
          status: value(form, 'status'), major: value(form, 'major'), year: value(form, 'year'),
        });
        say(msg, 'ok', 'تم حفظ التغييرات.');
        $('#acc-hello', root)!.textContent = `أهلاً ${value(form, 'full_name').split(/\s+/)[0]}`;
      } catch (err) {
        say(msg, 'error', arabicError(err as Error));
      }
      busy(save, false);
    });
  }

  async function renderEnrollments(userId: string) {
    const list = $('#enr-list', root)!;
    const items = await fetchEnrollments(userId);
    list.replaceChildren(...items.map(enrollmentRow));
    $('#enr-empty', root)!.hidden = items.length > 0;
    refreshPicker(items);
  }

  function enrollmentRow(e: Enrollment): HTMLElement {
    const side = el('div', { class: 'entry__side' }, el('span', { class: 'status', text: statusLabel[e.status], attrs: { 'data-status': e.status } }));
    if (e.status === 'pending') {
      const cancel = el('button', { class: 'mini-btn', text: 'إلغاء', attrs: { type: 'button' } });
      cancel.addEventListener('click', async () => {
        cancel.disabled = true;
        try {
          await cancelEnrollment(e.id);
          await renderEnrollments(uid);
        } catch (err) {
          say(errorBox, 'error', arabicError(err as Error));
          cancel.disabled = false;
        }
      });
      side.append(cancel);
    }
    return el('li', { class: 'entry' },
      el('div', { class: 'entry__main' },
        el('div', { class: 'entry__title', text: enrollmentTitle(e) }),
        el('div', { class: 'entry__meta', text: `رقم الطلب ${e.ticket} · ${fmtDate(e.created_at)}` }),
      ),
      side,
    );
  }

  function refreshPicker(current: Enrollment[]) {
    const have = new Set(current.map((c) => `${c.kind}:${c.ref}`));
    const options: { key: string; label: string }[] = [
      { key: `workshop:${WORKSHOP_REF}`, label: WORKSHOP_TITLE },
      ...tracks.map((t) => ({ key: `track:${t.id}`, label: t.title })),
    ].filter((o) => !have.has(o.key));
    const select = $<HTMLSelectElement>('#enr-select', root)!;
    select.replaceChildren(...options.map((o) => el('option', { text: o.label, attrs: { value: o.key } })));
    $('#enr-add', root)!.hidden = options.length === 0;
  }

  function wireAdd(userId: string) {
    const button = $<HTMLButtonElement>('#enr-add-btn', root)!;
    button.addEventListener('click', async () => {
      const [kind, ref] = $<HTMLSelectElement>('#enr-select', root)!.value.split(':');
      if (!kind || !ref) return;
      busy(button, true);
      try {
        await enroll(userId, kind as Enrollment['kind'], ref);
        await renderEnrollments(userId);
      } catch (err) {
        say(errorBox, 'error', arabicError(err as Error));
      }
      busy(button, false);
    });
  }

  async function renderCertificates(userId: string) {
    const certs = await fetchCertificates(userId);
    $('#cert-list', root)!.replaceChildren(...certs.map((c) =>
      el('li', { class: 'entry' },
        el('div', { class: 'entry__main' },
          el('div', { class: 'entry__title', text: c.title }),
          el('div', { class: 'entry__meta', text: `رمز التحقق ${c.code} · ${fmtDate(c.issued_at)}` }),
        ),
      )));
    $('#cert-empty', root)!.hidden = certs.length > 0;
  }
}

/** Apply choices made at sign-up (before email confirmation) or via /account?enroll=track:ai. */
async function applyPending(userId: string) {
  const wanted: PendingEnrollment[] = readPending(storage.get(PENDING_KEY));
  const fromUrl = new URLSearchParams(location.search).get('enroll');
  if (fromUrl) {
    const [kind, ref] = fromUrl.split(':');
    if ((kind === 'track' || kind === 'workshop') && ref) wanted.push({ kind, ref });
  }
  if (!wanted.length) return;
  for (const w of wanted) await enroll(userId, w.kind, w.ref);
  storage.set(PENDING_KEY, '[]');
  if (fromUrl) history.replaceState(null, '', '/account');
}

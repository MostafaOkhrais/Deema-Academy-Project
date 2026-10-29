import { $, $$, storage } from '../lib/dom';
import { supabase } from '../lib/supabase';
import { arabicError, enroll, getSession, WORKSHOP_REF } from '../lib/accounts';
import { PENDING_KEY, type PendingEnrollment } from '../lib/pending';
import { busy, check, emailRe, say, value } from '../lib/forms';

const root = $('[data-signup]');
if (root) {
  const form = $<HTMLFormElement>('#su-form', root)!;
  const panes = $$<HTMLFieldSetElement>('.pane', form);
  const bar = $('#su-bar', root)!;
  const stepLabel = $('#su-step', root)!;
  const msg = $('#su-msg', root);
  const submit = $<HTMLButtonElement>('#su-submit', root)!;
  const checked = (name: string) => $$<HTMLInputElement>(`input[name="${name}"]:checked`, form);

  // Already signed in: no reason to see this page.
  getSession().then((s) => { if (s) location.replace('/account'); });

  // Pre-select what the visitor clicked on the landing page.
  const params = new URLSearchParams(location.search);
  const wantedTrack = params.get('track');
  if (wantedTrack) {
    const box = $<HTMLInputElement>(`input[name="tracks"][value="${CSS.escape(wantedTrack)}"]`, form);
    if (box) box.checked = true;
  }
  if (params.get('workshop')) {
    const box = $<HTMLInputElement>('input[name="workshop"]', form);
    if (box) box.checked = true;
  }

  const showStep = (n: number) => {
    panes.forEach((p) => { p.hidden = Number(p.dataset.pane) !== n; });
    bar.style.width = `${n * 50}%`;
    stepLabel.textContent = n === 1 ? 'الخطوة 1 من 2: بيانات الحساب' : 'الخطوة 2 من 2: ملفك واهتماماتك';
  };

  const validate = (step: 1 | 2) => check(form, () => {
    const bad: [string, string][] = [];
    if (step === 1) {
      if (value(form, 'full_name').split(/\s+/).filter(Boolean).length < 2) bad.push(['full_name', 'اكتب اسمك الكامل (اسمان على الأقل)']);
      if (!emailRe.test(value(form, 'email'))) bad.push(['email', 'اكتب بريداً إلكترونياً صحيحاً']);
      if (value(form, 'phone').replace(/\D/g, '').length < 8) bad.push(['phone', 'اكتب رقم جوال صحيح مع رمز الدولة']);
      if (value(form, 'password').length < 8) bad.push(['password', 'كلمة المرور 8 أحرف على الأقل']);
    } else {
      if (!value(form, 'status')) bad.push(['status', 'اختر وضعك الحالي']);
      if (!value(form, 'major')) bad.push(['major', 'اختر تخصصك الدراسي']);
      if (!(form.elements.namedItem('consent') as HTMLInputElement).checked) bad.push(['consent', 'نحتاج موافقتك للتواصل معك']);
    }
    return bad;
  });

  $('#su-next', root)!.addEventListener('click', () => { if (validate(1)) showStep(2); });
  $('#su-back', root)!.addEventListener('click', () => showStep(1));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(1)) return showStep(1);
    if (!validate(2)) return;

    const wanted: PendingEnrollment[] = [
      ...(checked('workshop').length ? [{ kind: 'workshop' as const, ref: WORKSHOP_REF }] : []),
      ...checked('tracks').map((c) => ({ kind: 'track' as const, ref: c.value })),
    ];

    busy(submit, true);
    say(msg, '');
    const { data, error } = await supabase().auth.signUp({
      email: value(form, 'email'),
      password: value(form, 'password'),
      options: {
        emailRedirectTo: `${location.origin}/account`,
        data: {
          full_name: value(form, 'full_name'), phone: value(form, 'phone'), city: value(form, 'city'),
          status: value(form, 'status'), major: value(form, 'major'), year: value(form, 'year'),
        },
      },
    });

    if (error) {
      busy(submit, false);
      return say(msg, 'error', arabicError(error));
    }
    // With email confirmation on, an existing address comes back with no identities. Show the same
    // "check your email" outcome as for a new address so the form cannot be used to probe accounts.
    const alreadyRegistered = Boolean(data.user && data.user.identities?.length === 0);

    if (!alreadyRegistered && data.session && data.user) {
      try {
        for (const w of wanted) await enroll(data.user.id, w.kind, w.ref);
      } catch { /* the member can add them again from the account page */ }
      location.assign('/account');
      return;
    }

    // Confirmation required: keep the choices and apply them on first visit to /account.
    if (!alreadyRegistered) storage.set(PENDING_KEY, JSON.stringify(wanted));
    form.hidden = true;
    $('.progress', root)!.setAttribute('hidden', '');
    stepLabel.hidden = true;
    const done = $('#su-done', root)!;
    done.hidden = false;
    done.focus();
  });
}

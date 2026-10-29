import { $ } from '../lib/dom';
import { supabase } from '../lib/supabase';
import { arabicError, getSession, safeNext } from '../lib/accounts';
import { busy, check, emailRe, say, value } from '../lib/forms';

const form = $<HTMLFormElement>('#li-form');
if (form) {
  const next = safeNext(new URLSearchParams(location.search).get('next'));
  const msg = $('#li-msg');
  const submit = $<HTMLButtonElement>('#li-submit')!;

  getSession().then((s) => { if (s) location.replace(next); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = check(form, () => {
      const bad: [string, string][] = [];
      if (!emailRe.test(value(form, 'email'))) bad.push(['email', 'اكتب بريداً إلكترونياً صحيحاً']);
      if (!value(form, 'password')) bad.push(['password', 'اكتب كلمة المرور']);
      return bad;
    });
    if (!ok) return;

    busy(submit, true);
    say(msg, '');
    const { error } = await supabase().auth.signInWithPassword({
      email: value(form, 'email'),
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
    });
    if (error) {
      busy(submit, false);
      return say(msg, 'error', arabicError(error));
    }
    location.assign(next);
  });
}

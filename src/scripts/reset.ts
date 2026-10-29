import { $ } from '../lib/dom';
import { supabase } from '../lib/supabase';
import { arabicError } from '../lib/accounts';
import { busy, check, emailRe, say, value } from '../lib/forms';

const root = $('[data-reset]');
if (root) {
  const request = $<HTMLFormElement>('#rs-request', root)!;
  const change = $<HTMLFormElement>('#rs-new', root)!;

  // The e-mailed link lands here with a recovery session: swap to the "new password" form.
  supabase().auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      request.hidden = true;
      change.hidden = false;
      $<HTMLInputElement>('#rs-password', change)?.focus();
    }
  });

  request.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#rs-msg', request);
    const ok = check(request, () => (emailRe.test(value(request, 'email')) ? [] : [['email', 'اكتب بريداً إلكترونياً صحيحاً']]));
    if (!ok) return;
    const button = $<HTMLButtonElement>('#rs-send', request)!;
    busy(button, true);
    const { error } = await supabase().auth.resetPasswordForEmail(value(request, 'email'), {
      redirectTo: `${location.origin}/reset`,
    });
    busy(button, false);
    // Same answer whether or not the address exists, so the form cannot be used to probe accounts.
    if (error && !/not found/i.test(error.message)) return say(msg, 'error', arabicError(error));
    say(msg, 'ok', 'إذا كان البريد مسجّلاً عندنا، وصلتك رسالة فيها رابط الاستعادة.');
  });

  change.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#rs-msg2', change);
    const ok = check(change, () => (value(change, 'password').length >= 8 ? [] : [['password', 'كلمة المرور 8 أحرف على الأقل']]));
    if (!ok) return;
    const button = $<HTMLButtonElement>('#rs-save', change)!;
    busy(button, true);
    const { error } = await supabase().auth.updateUser({ password: (change.elements.namedItem('password') as HTMLInputElement).value });
    if (error) {
      busy(button, false);
      return say(msg, 'error', arabicError(error));
    }
    say(msg, 'ok', 'تم تغيير كلمة المرور. جاري تحويلك لحسابك…');
    setTimeout(() => location.assign('/account'), 900);
  });
}

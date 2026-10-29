import { getSession } from '../lib/accounts';

// Signed-in members skip the sign-up form: the enroll buttons add the item straight to their account.
getSession().then((session) => {
  if (!session) return;
  document.querySelectorAll<HTMLAnchorElement>('[data-enroll]').forEach((a) => {
    a.href = `/account?enroll=${encodeURIComponent(a.dataset.enroll ?? '')}`;
  });
});

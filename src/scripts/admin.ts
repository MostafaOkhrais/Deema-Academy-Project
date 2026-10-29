import { $, $$, el } from '../lib/dom';
import { arabicError, enrollmentTitle, fetchProfile, requireSession, statusLabel, type EnrollmentStatus, type Profile } from '../lib/accounts';
import { deleteQuestion, fetchAllEnrollments, fetchMembers, fetchQuestions, issueCertificate, setEnrollmentStatus, type AdminEnrollment, type Question } from '../lib/admin';
import { fmtDate, say } from '../lib/forms';

const root = $('[data-admin]');
if (root) void start(root);

async function start(root: HTMLElement) {
  const session = await requireSession();
  if (!session) return;
  const msg = $('#ad-msg', root);

  const me = await fetchProfile(session.user.id).catch(() => null);
  $('#ad-loading')!.hidden = true;
  if (me?.role !== 'admin') {
    $('#ad-denied')!.hidden = false;
    return;
  }
  root.hidden = false;

  let enrollments: AdminEnrollment[] = [];
  let members: Profile[] = [];
  let questions: Question[] = [];
  try {
    [enrollments, members, questions] = await Promise.all([fetchAllEnrollments(), fetchMembers(), fetchQuestions()]);
  } catch (e) {
    say(msg, 'error', arabicError(e as Error));
  }

  const q = $<HTMLInputElement>('#ad-q', root)!;
  const statusFilter = $<HTMLSelectElement>('#ad-status', root)!;
  const mq = $<HTMLInputElement>('#ad-mq', root)!;
  const matches = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.trim().toLowerCase());

  function summary() {
    const pending = enrollments.filter((e) => e.status === 'pending').length;
    $('#ad-summary', root)!.textContent = `${members.length} مشترك · ${enrollments.length} طلب · ${pending} قيد المراجعة`;
  }

  function renderRequests() {
    const list = $('#ad-req-list', root)!;
    const rows = enrollments.filter((e) =>
      (!statusFilter.value || e.status === statusFilter.value) &&
      matches(`${e.profiles?.full_name ?? ''} ${e.profiles?.email ?? ''} ${e.ticket}`, q.value));
    list.replaceChildren(...rows.map(requestRow));
    $('#ad-req-empty', root)!.hidden = rows.length > 0;
  }

  function requestRow(e: AdminEnrollment): HTMLElement {
    const select = el('select', { attrs: { 'aria-label': 'تغيير الحالة' } },
      ...(Object.keys(statusLabel) as EnrollmentStatus[]).map((s) => {
        const o = el('option', { text: statusLabel[s], attrs: { value: s } });
        o.selected = s === e.status;
        return o;
      }));
    select.addEventListener('change', async () => {
      const next = select.value as EnrollmentStatus;
      const previous = e.status;
      select.disabled = true;
      try {
        await setEnrollmentStatus(e.id, next);
        e.status = next;
        say(msg, 'ok', 'تم تحديث الحالة.');
        summary();
        renderRequests();
      } catch (err) {
        select.value = previous;
        say(msg, 'error', arabicError(err as Error));
      }
      select.disabled = false;
    });

    const side = el('div', { class: 'entry__side' }, select);
    if (e.status === 'approved' || e.status === 'completed') {
      const cert = el('button', { class: 'mini-btn', text: 'إصدار شهادة', attrs: { type: 'button' } });
      cert.addEventListener('click', async () => {
        const who = e.profiles?.full_name || e.profiles?.email || '';
        if (!confirm(`إصدار شهادة «${enrollmentTitle(e)}» باسم ${who}؟`)) return;
        cert.disabled = true;
        try {
          const issued = await issueCertificate(e.user_id, enrollmentTitle(e), e.ref);
          say(msg, 'ok', `صدرت الشهادة. رمز التحقق: ${issued.code}`);
        } catch (err) {
          say(msg, 'error', arabicError(err as Error));
        }
        cert.disabled = false;
      });
      side.append(cert);
    }

    return el('li', { class: 'entry' },
      el('div', { class: 'entry__main' },
        el('div', { class: 'entry__title', text: e.profiles?.full_name || '—' }),
        el('div', { class: 'entry__meta', text: [e.profiles?.email, e.profiles?.phone, e.profiles?.major].filter(Boolean).join(' · ') }),
        el('div', { class: 'entry__meta', text: `${enrollmentTitle(e)} · ${e.ticket} · ${fmtDate(e.created_at)}` }),
      ),
      side,
    );
  }

  function renderMembers() {
    const rows = members.filter((m) => matches(`${m.full_name} ${m.email}`, mq.value));
    $('#ad-mem-list', root)!.replaceChildren(...rows.map((m) =>
      el('li', { class: 'entry' },
        el('div', { class: 'entry__main' },
          el('div', { class: 'entry__title', text: m.full_name || '—' }),
          el('div', { class: 'entry__meta', text: [m.email, m.phone, m.city, m.major, m.year].filter(Boolean).join(' · ') }),
        ),
        el('div', { class: 'entry__side' }, m.role === 'admin' ? el('span', { class: 'status', text: 'إدارة', attrs: { 'data-status': 'approved' } }) : ''),
      )));
    $('#ad-mem-empty', root)!.hidden = rows.length > 0;
  }

  // tabs
  const tabs = $$<HTMLButtonElement>('.tabbtn', root);
  const panels = [$('#ad-requests', root)!, $('#ad-members', root)!, $('#ad-questions', root)!];
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    panels.forEach((p, k) => { p.hidden = k !== i; });
  }));

  function renderQuestions() {
    $('#ad-q-list', root)!.replaceChildren(...questions.map((item) => {
      const remove = el('button', { class: 'mini-btn', text: 'حذف', attrs: { type: 'button' } });
      remove.addEventListener('click', async () => {
        if (!confirm('حذف هذا السؤال؟')) return;
        remove.disabled = true;
        try {
          await deleteQuestion(item.id);
          questions = questions.filter((x) => x.id !== item.id);
          renderQuestions();
        } catch (err) {
          say(msg, 'error', arabicError(err as Error));
          remove.disabled = false;
        }
      });
      return el('li', { class: 'entry' },
        el('div', { class: 'entry__main' },
          el('div', { class: 'entry__title', text: item.question }),
          el('div', { class: 'entry__meta', text: [item.contact, fmtDate(item.created_at)].filter(Boolean).join(' · ') }),
        ),
        el('div', { class: 'entry__side' }, remove),
      );
    }));
    $('#ad-q-empty', root)!.hidden = questions.length > 0;
  }

  q.addEventListener('input', renderRequests);
  statusFilter.addEventListener('change', renderRequests);
  mq.addEventListener('input', renderMembers);
  summary();
  renderRequests();
  renderMembers();
  renderQuestions();
}

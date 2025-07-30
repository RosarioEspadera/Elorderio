import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';
const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

window.addEventListener('DOMContentLoaded', async () => {
  const nav = document.querySelector('.bottom-tab');
  if (!nav) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) return;

  const me = session.user.id;
  const isAdmin = me === ADMIN_ID;

  // Create dynamic inbox link
  const inboxLink = document.createElement('a');
  inboxLink.className = 'tab-link';
  inboxLink.href = isAdmin ? 'inbox_admin.html' : 'inbox_user.html';
  inboxLink.innerHTML = `<span>📥</span><p>${isAdmin ? 'Admin Inbox' : 'My Inbox'}</p>`;

  // Inject before active tab or at end
  nav.appendChild(inboxLink);
});

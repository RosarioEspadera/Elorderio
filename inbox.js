import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Setup
const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; // Replace with secure env key
const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Ready
window.addEventListener('DOMContentLoaded', async () => {
  const inbox = document.getElementById('inbox-list');
  if (!inbox) return console.warn('Inbox container not found.');

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user?.id) {
    return window.location.replace('auth.html');
  }

  const me = session.user.id;
  const isAdmin = me === ADMIN_ID;

  if (!isAdmin) {
    // Redirect customer to their chat with admin
    return window.location.replace(`chat.html?with=${ADMIN_ID}`);
  }

  // Update UI for admin
  document.querySelector('.chat-header h2').textContent = '📥 Admin Inbox';
  document.querySelector('.chat-header p').textContent = 'Select a customer to view the chat';

  // Load inbox
  const { data: messages, error: inboxError } = await supabase
    .from('messages')
    .select(`
      id, content, created_at, user_id, to_user_id,
      sender:profiles!messages_user_id_fkey(email, avatar_url)
    `)
    .or(`user_id.eq.${ADMIN_ID},to_user_id.eq.${ADMIN_ID}`)
    .order('created_at', { ascending: false });

  if (inboxError) {
    console.error('❌ Inbox fetch failed:', inboxError);
    return;
  }

  renderInbox(messages, inbox);
});

function renderInbox(messages, container) {
  const seen = new Set();
  container.innerHTML = '';

  messages.forEach(msg => {
    const otherId = msg.user_id === ADMIN_ID ? msg.to_user_id : msg.user_id;
    if (!otherId || seen.has(otherId)) return;
    seen.add(otherId);

    const { email = 'Unknown', avatar_url = 'default-avatar.png' } = msg.sender || {};
    const preview = msg.content?.slice(0, 40) || '…';

    const card = document.createElement('a');
    card.className = 'message them';
    card.href = `chat.html?with=${otherId}`;
    card.innerHTML = `
      <img class="avatar" src="${avatar_url}" alt="${email}'s avatar" />
      <div>
        <strong>${email}</strong><br/>
        <small>${preview}</small>
      </div>
    `;
    container.appendChild(card);
  });
}

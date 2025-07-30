import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Setup
const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';
const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

window.addEventListener('DOMContentLoaded', async () => {
  const inbox = document.getElementById('inbox-list');

  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.replace('auth.html');

  const me = session.user.id;
  const isAdmin = me === ADMIN_ID;

  if (!isAdmin) {
    // If customer, auto-load chat with admin
    return window.location.replace(`chat.html?with=${ADMIN_ID}`);
  }

  // If admin, show inbox of unique customers who messaged
  document.querySelector('.chat-header h2').textContent = '📥 Admin Inbox';
  document.querySelector('.chat-header p').textContent  = 'Select a customer to view the chat';

  const { data, error } = await supabase
    .from('messages')
    .select(`
      user_id, content, created_at,
      sender:profiles!messages_user_id_fkey(email, avatar_url)
    `)
    .eq('to_user_id', me)
    .order('created_at', { ascending: false });

  if (error) return console.error('Admin inbox error:', error);

  const seen = new Set();
  inbox.innerHTML = '';

  data.forEach(msg => {
    const otherId = msg.user_id;
    if (otherId === ADMIN_ID || seen.has(otherId)) return;
    seen.add(otherId);

    const profile = msg.sender;
    const email   = profile?.email || 'Unknown';
    const avatar  = profile?.avatar_url || 'default-avatar.png';
   const preview = msg.content?.slice(0, 40) || '…';


    const card = document.createElement('a');
    card.className = 'message them';
    card.href = `chat.html?with=${otherId}`;
    card.innerHTML = `
      <img class="avatar" src="${avatar}" alt="${email}'s avatar" />
      <div>
        <strong>${email}</strong><br/>
        <small>${preview}</small>
      </div>
    `;
    inbox.appendChild(card);
  });
});

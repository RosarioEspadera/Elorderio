// chat.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';
const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let sessionUser;
let chatChannel;

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => {
  if (chatChannel) supabase.removeChannel(chatChannel);
});

async function init() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    window.location.replace('auth.html');
    return;
  }

  sessionUser = session.user;

  try {
    await Promise.all([
      ensureProfileExists(sessionUser.id, sessionUser.user_metadata),
      loadMessages()
    ]);

    subscribeToMessages();

    const form = document.getElementById('message-form');
    form?.addEventListener('submit', sendMessage);
  } catch (err) {
    console.error('🚨 Init failed:', err);
    alert('Something went wrong while setting up chat.');
  }
}


async function ensureProfileExists(userId, metadata) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId);

  if (!data || data.length === 0) {
    await supabase.from('profiles').upsert([{
      id: userId,
      email: metadata?.email || '',
      avatar_url: metadata?.avatar_url || `https://robohash.org/${userId}`
    }]);
    console.log('✅ Created new profile for', userId);
  }
}


async function loadMessages() {
  const me = sessionUser.id;

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_user_id_fkey(id,email)
    `)
    .or(`and(user_id.eq.${me},to_user_id.neq.${me}),and(user_id.neq.${me},to_user_id.eq.${me})`)
    .order('created_at', { ascending: true });

  if (error) return console.error('Load error:', error);

  const list = document.getElementById('message-list');
  if (!list) return;

  list.innerHTML = '';
  data.forEach(msg => appendMessage({
    ...msg,
    senderEmail: msg.sender?.email
  }));

  scrollToBottom();
}

function subscribeToMessages() {
  const me = sessionUser.id;

  chatChannel = supabase
    .channel(`chat-${me}-${ADMIN_ID}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `or(user_id=eq.${me},to_user_id=eq.${me})`
    }, ({ new: msg }) => {
      const isRelevant =
        (msg.user_id === me && msg.to_user_id === ADMIN_ID) ||
        (msg.user_id === ADMIN_ID && msg.to_user_id === me);

      if (isRelevant) {
        appendMessage({
          ...msg,
          senderEmail: msg.profiles?.email || 'Unknown sender'
        });
        scrollToBottom();
      }
    })
    .subscribe(({ error }) => {
      if (error) console.error('Subscription error:', error);
    });
}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('message-input');
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  const { error } = await supabase.from('messages').insert({
    content,
    user_id: sessionUser.id,
    to_user_id: ADMIN_ID
  });

  if (error) console.error('Send error:', error);
  else input.value = '';
}

function appendMessage(msg) {
  const me = sessionUser.id;
  const isMine = msg.user_id === me;

  const el = document.createElement('div');
  el.className = `message ${isMine ? 'you' : 'them'}`;
  el.innerHTML = `
    <strong>${isMine ? 'You' : sanitize(msg.senderEmail || 'Unknown sender')}</strong><br/>
    ${sanitize(msg.content)}
    <small>${new Date(msg.created_at).toLocaleTimeString()}</small>
  `;

  const list = document.getElementById('message-list');
  if (list) list.appendChild(el);
}

function scrollToBottom() {
  const list = document.getElementById('message-list');
  if (list) list.scrollTop = list.scrollHeight;
}

function sanitize(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

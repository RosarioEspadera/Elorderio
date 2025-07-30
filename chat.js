// chat.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2) STATE
let sessionUser;
let otherUserId;
let chatChannel;

// 3) LIFECYCLE
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => {
  if (chatChannel) supabase.removeChannel(chatChannel);
});

// 4) BOOTSTRAP
async function init() {
  // a) Ensure logged in
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) return window.location.replace('auth.html');
  sessionUser = session.user;

  // b) Determine chat partner: ?with=USER_ID or fallback to admin
  const urlParams   = new URLSearchParams(window.location.search);
  otherUserId       = urlParams.get('with') || ADMIN_ID;

  // c) Fetch history, listen for new messages, wire form
  await loadMessages();
  subscribe();
  document
    .getElementById('message-form')
    .addEventListener('submit', sendMessage);
}

// 5) DATA LAYER
async function loadMessages() {
  const filter = `or(
    and(user_id.eq.${sessionUser.id},to_user_id.eq.${otherUserId}),
    and(user_id.eq.${otherUserId},to_user_id.eq.${sessionUser.id})
  )`;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(filter)
    .order('inserted_at', { ascending: true });

  if (error) return console.error('Load error:', error);
  data.forEach(appendMessage);
  scrollToBottom();
}

function subscribe() {
  chatChannel = supabase
    .channel(`chat-${sessionUser.id}-${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(user_id.eq.${sessionUser.id},to_user_id.eq.${sessionUser.id})`
      },
      ({ new: msg }) => {
        // Only show if it belongs to this 1-to-1 convo
        const isMyMsg   = msg.user_id    === sessionUser.id && msg.to_user_id === otherUserId;
        const isTheirMsg= msg.user_id    === otherUserId    && msg.to_user_id === sessionUser.id;
        if (isMyMsg || isTheirMsg) {
          appendMessage(msg);
          scrollToBottom();
        }
      }
    )
    .subscribe(({ error }) => {
      if (error) console.error('Subscription error:', error);
    });
}

async function sendMessage(e) {
  e.preventDefault();
  const input   = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content) return;

  const { error } = await supabase.from('messages').insert([
    {
      user_id     : sessionUser.id,
      to_user_id  : otherUserId,
      content
    }
  ]);

  if (error) console.error('Send error:', error);
  input.value = '';
}

// 6) UI HELPERS
function appendMessage(msg) {
  const isMine = msg.user_id === sessionUser.id;
  const el     = document.createElement('div');
  el.className = `message ${isMine ? 'you' : 'them'}`;
  el.innerHTML = `
    ${sanitize(msg.content)}
    <small>${new Date(msg.inserted_at).toLocaleTimeString()}</small>
  `;
  document.getElementById('message-list').append(el);
}

function scrollToBottom() {
  const list = document.getElementById('message-list');
  list.scrollTop = list.scrollHeight;
}

function sanitize(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

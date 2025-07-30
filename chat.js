// chat.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

);

// ─── STATE ────────────────────────────────────────────────
let sessionUser;
let otherUserId;
let chatChannel;

// ─── LIFECYCLE ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => {
  if (chatChannel) supabase.removeChannel(chatChannel);
});

// ─── INIT ──────────────────────────────────────────────────
async function init() {
  // 1) Auth guard
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.replace('auth.html');
  sessionUser = session.user;

  // 2) Determine chat partner
  const params      = new URLSearchParams(location.search);
  otherUserId       = params.get('with') || ADMIN_ID;

  // 3) Load history, subscribe, bind form
  await loadMessages();
  subscribe();
  document.getElementById('message-form')
          .addEventListener('submit', sendMessage);
}

// ─── LOAD MESSAGES ─────────────────────────────────────────
async function loadMessages() {
  const me     = sessionUser.id;
  const them   = otherUserId;
  const filter = `or(and(user_id.eq.${me},to_user_id.eq.${them}),` +
                 `and(user_id.eq.${them},to_user_id.eq.${me}))`;

  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(email)')
    .or(filter)
    .order('created_at', { ascending: true });

  if (error) return console.error('Load error:', error);
  data.forEach(msg => appendMessage({ 
    ...msg, 
    senderEmail: msg.profiles.email 
  }));
  scrollToBottom();
}

// ─── REAL-TIME SUBSCRIBE ────────────────────────────────────
function subscribe() {
  const me = sessionUser.id;

  chatChannel = supabase
    .channel(`chat-${me}-${otherUserId}`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(user_id=eq.${me},to_user_id=eq.${me})`
      },
      ({ new: msg }) => {
        const isMine   = msg.user_id    === me && msg.to_user_id === otherUserId;
        const isTheirs = msg.user_id    === otherUserId && msg.to_user_id === me;
        if (isMine || isTheirs) {
          appendMessage({ 
            ...msg, 
            senderEmail: msg.profiles?.email || '' 
          });
          scrollToBottom();
        }
      }
    )
    .subscribe(({ error }) => {
      if (error) console.error('Subscription error:', error);
    });
}

// ─── SEND MESSAGE ───────────────────────────────────────────
async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content) return;

  const { error } = await supabase
    .from('messages')
    .insert([{
      user_id: sessionUser.id,
      to_user_id: otherUserId,
      content
    }]);

  if (error) console.error('Send error:', error);
  input.value = '';
}

// ─── APPEND + CLICK HANDLER ─────────────────────────────────
function appendMessage(msg) {
  const me     = sessionUser.id;
  const isMine = msg.user_id === me;
  const el     = document.createElement('div');

  el.className = `message ${isMine ? 'you' : 'them'}`;
  el.dataset.userId  = msg.user_id;
  el.dataset.email   = msg.senderEmail || '';
  el.innerHTML = `
    <strong>${isMine ? 'You' : msg.senderEmail}</strong><br/>
    ${sanitize(msg.content)}
    <small>${new Date(msg.created_at).toLocaleTimeString()}</small>
  `;

  el.addEventListener('click', handleMessageClick);
  document.getElementById('message-list').append(el);
}

// ─── MESSAGE CLICK & REPLY MODAL ───────────────────────────
function handleMessageClick(e) {
  const el     = e.currentTarget;
  const userId = el.dataset.userId;
  const email  = el.dataset.email;
  openReplyModal({ userId, email });
}

function openReplyModal({ userId, email }) {
  const modal   = document.getElementById('reply-modal');
  document.getElementById('reply-title').textContent =
    `Reply to ${email || userId}`;
  modal.style.display = 'flex';

  modal.querySelector('#close-reply').onclick = () => {
    modal.style.display = 'none';
  };

  modal.querySelector('#send-reply').onclick = async () => {
    const content = document.getElementById('reply-content').value.trim();
    if (!content) return;
    await supabase.from('messages').insert([{
      user_id    : sessionUser.id,
      to_user_id : userId,
      content
    }]);
    modal.style.display = 'none';
    document.getElementById('reply-content').value = '';
  };
}

// ─── UTILS ───────────────────────────────────────────────────
function scrollToBottom() {
  const list = document.getElementById('message-list');
  list.scrollTop = list.scrollHeight;
}

function sanitize(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

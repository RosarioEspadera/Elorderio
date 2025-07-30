// chat.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const ADMIN_ID = '081ee8b0-334c-4446-a8f0-bccfba864f6c';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


// ─── STATE ────────────────────────────────────────────────────
let sessionUser;
let otherUserId;
let chatChannel;

// ─── LIFECYCLE ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => {
  if (chatChannel) supabase.removeChannel(chatChannel);
});

// ─── INIT ─────────────────────────────────────────────────────
async function init() {
  // 1) Auth guard
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.replace('auth.html');
  sessionUser = session.user;

  // 2) Determine partner: ?with=ID or fallback
  const params      = new URLSearchParams(window.location.search);
  otherUserId       = params.get('with') || ADMIN_ID;

  // 3) Fetch history, bind real-time, wire form
  await loadMessages();
  subscribe();
  document.getElementById('message-form')
          .addEventListener('submit', sendMessage);
}

// ─── DATA LAYER ──────────────────────────────────────────────
async function loadMessages() {
  // collapse into one line—no stray `\n`
  const filter = `or(and(user_id.eq.${sessionUser.id},to_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},to_user_id.eq.${sessionUser.id}))`;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(filter)
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('Load error:', error);
    return;
  }

  data.forEach(appendMessage);
  scrollToBottom();
}

function subscribe() {
  chatChannel = supabase
    .channel(`chat-${sessionUser.id}-${otherUserId}`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(user_id.eq.${sessionUser.id},to_user_id.eq.${sessionUser.id})`
      },
      ({ new: msg }) => {
        const isMine   = msg.user_id    === sessionUser.id && msg.to_user_id === otherUserId;
        const isTheirs = msg.user_id    === otherUserId    && msg.to_user_id === sessionUser.id;
        if (isMine || isTheirs) {
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
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content) return;

  const { error } = await supabase.from('messages').insert([{
    user_id    : sessionUser.id,
    to_user_id : otherUserId,
    content
  }]);

  if (error) console.error('Send error:', error);
  input.value = '';
}

// ─── UI HELPERS ─────────────────────────────────────────────
// ─── 1. Update appendMessage to stash metadata & bind click ───
function appendMessage(msg) {
  const isSelf = msg.user_id === sessionUser.id;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isSelf ? 'you' : 'them'}`;

  // attach data attributes
  wrapper.dataset.userId = msg.user_id;
  // if you fetched email via a profiles join, you’ll have msg.senderEmail
  wrapper.dataset.email  = msg.senderEmail || '';

  wrapper.innerHTML = `
    ${sanitize(msg.content)}
    <small>${new Date(msg.inserted_at).toLocaleTimeString()}</small>
  `;

  // bind our click handler
  wrapper.addEventListener('click', handleMessageClick);

  document.getElementById('message-list').append(wrapper);
}

// ─── 2. The click handler ─────────────────────────────────────
function handleMessageClick(e) {
  const el      = e.currentTarget;
  const userId  = el.dataset.userId;
  const email   = el.dataset.email;

  // simple alert or console—swap in your own UI/modal
  alert(
    `Reply to:\n` +
    `User ID: ${userId}\n` +
    (email ? `Email: ${email}` : `No email on record`)
  );

  // you could also call a function to open a reply pane:
  // openReplyModal({ userId, email });
}

// ─── 3. (Optional) A basic reply modal stub ────────────────
function openReplyModal({ userId, email }) {
  // find or create a modal element in your DOM
  let modal = document.getElementById('reply-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reply-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <h2>Reply to ${email || userId}</h2>
        <textarea id="reply-content" rows="4"></textarea>
        <button id="send-reply">Send</button>
        <button id="close-reply">Cancel</button>
      </div>
    `;
    document.body.append(modal);

    // wire up close & send
    modal.querySelector('#close-reply')
      .addEventListener('click', () => modal.remove());
    modal.querySelector('#send-reply')
      .addEventListener('click', async () => {
        const content = modal.querySelector('#reply-content').value.trim();
        if (!content) return;
        await supabase.from('messages').insert([{
          user_id: sessionUser.id,
          to_user_id: userId,
          content
        }]);
        modal.remove();
      });
  }
  modal.style.display = 'block';
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

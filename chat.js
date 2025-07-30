// chat.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Who are we chatting *with*?
// customer opens: chat.html?with=<ADMIN_USER_ID>
const urlParams  = new URLSearchParams(window.location.search);
const otherUserId = urlParams.get('with');
if (!otherUserId) {
  alert('Chat target not specified.');
  throw new Error('Missing "with" query parameter');
}

let sessionUser;
let chatChannel;

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', tearDown);

async function init() {
  // 1) Ensure signed in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return window.location.replace('auth.html');
  }
  sessionUser = session.user;

  // 2) Load previous convo
  await loadMessages();

  // 3) Listen for new messages
  subscribe();

  // 4) Wire up send button
  document
    .getElementById('message-form')
    .addEventListener('submit', sendMessage);
}

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
    .channel(`private-chat-${sessionUser.id}-${otherUserId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `or(user_id.eq.${sessionUser.id},to_user_id.eq.${sessionUser.id})`
    }, ({ new: msg }) => {
      // only show rows in *our* convo
      const inConvo =
        (msg.user_id === sessionUser.id && msg.to_user_id === otherUserId) ||
        (msg.user_id === otherUserId    && msg.to_user_id === sessionUser.id);
      if (inConvo) {
        appendMessage(msg);
        scrollToBottom();
      }
    })
    .subscribe(({ error }) => {
      if (error) console.error('Subscription err:', error);
    });
}

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

  if (error) console.error('Send err:', error);
  input.value = '';
}

function appendMessage(msg) {
  const el = document.createElement('div');
  el.className = `message ${msg.user_id === sessionUser.id ? 'you' : 'them'}`;
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

function tearDown() {
  if (chatChannel) supabase.removeChannel(chatChannel);
}

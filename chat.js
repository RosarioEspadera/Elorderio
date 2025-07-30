// chat.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const messageList = document.getElementById('message-list');
const messageForm = document.getElementById('message-form');
const messageInput= document.getElementById('message-input');

let sessionUser;

window.addEventListener('DOMContentLoaded', init);

async function init() {
  // 1. Check auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirectToAuth();

  sessionUser = session.user;
  // 2. Load existing messages
  await loadMessages();

  // 3. Subscribe to new messages
  supabase
    .from('messages')
    .on('INSERT', payload => {
      appendMessage(payload.new);
      scrollToBottom();
    })
    .subscribe();

  // 4. Form submit → send message
  messageForm.addEventListener('submit', sendMessage);
}

function redirectToAuth() {
  window.location.href = 'auth.html';
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('inserted_at', { ascending: true });

  if (error) return console.error('Load messages error:', error);

  data.forEach(appendMessage);
  scrollToBottom();
}

function appendMessage(msg) {
  const el = document.createElement('div');
  el.className = `message ${msg.user_id === sessionUser.id ? 'you' : 'them'}`;
  el.innerHTML = `
    ${sanitize(msg.content)}
    <small>${new Date(msg.inserted_at).toLocaleTimeString()}</small>
  `;
  messageList.append(el);
}

async function sendMessage(e) {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content) return;
  await supabase.from('messages').insert([
    { user_id: sessionUser.id, content }
  ]);
  messageInput.value = '';
}

function scrollToBottom() {
  messageList.scrollTop = messageList.scrollHeight;
}

// very basic sanitizer
function sanitize(str) {
  return str.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;');
}

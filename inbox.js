import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Setup
const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; // Replace with secure env key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// Fetch existing messages
async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('content, created_at, profiles(username)')
    .order('created_at', { ascending: true });

  if (error) console.error('Error loading messages:', error);
  else renderMessages(data);
}

// Render messages to the chat box
function renderMessages(messages) {
  chatBox.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<strong>${msg.profiles?.username || 'User'}:</strong> ${msg.content}`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send a new message
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = chatInput.value.trim();
  if (!content) return;

  const { error } = await supabase.from('messages').insert({ content });
  if (error) console.error('Error sending message:', error);
  chatInput.value = '';
});

// Real-time subscription
supabase
  .channel('group-chat')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    renderMessages([...chatBox.children].map(c => ({
      content: c.textContent.split(': ')[1],
      profiles: { username: c.textContent.split(': ')[0] }
    })).concat(payload.new));
  })
  .subscribe();

loadMessages();

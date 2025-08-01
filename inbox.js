import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Setup
const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; // Replace with secure env key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

let currentUser = null;

// Get current user and ensure profile exists
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    console.error('Error fetching user:', error);
    return;
  }

  currentUser = data.user;

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (profileErr) {
    console.error('Error checking profile:', profileErr);
    return;
  }

  if (!profile) {
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: currentUser.id,
      username: currentUser.user_metadata?.name || 'Anonymous',
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      is_admin: false
    });

    if (insertErr) {
      console.error('Error inserting profile:', insertErr);
    } else {
      console.log('Profile created for user:', currentUser.id);
    }
  }
}

// Load messages
async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('content, created_at, sender_id, profiles(username, is_admin)')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading messages:', error);
    return;
  }

  renderMessages(data);
}

// Render messages
function renderMessages(messages) {
  chatBox.innerHTML = '';

  if (!messages.length) {
    chatBox.innerHTML = '<p class="chat-message">No messages yet. Start the conversation!</p>';
    return;
  }

  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-message';
    if (msg.profiles?.is_admin) div.classList.add('admin-message');

    div.innerHTML = `<strong>${msg.profiles?.username || 'User'}:</strong> ${msg.content}`;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = chatInput.value.trim();
  if (!content || !currentUser) return;

  const { error } = await supabase.from('messages').insert({
    sender_id: currentUser.id,
    content
  });

  if (error) {
    console.error('Error sending message:', error);
    return;
  }

  chatInput.value = '';
});

// Real-time updates
supabase
  .channel('group-chat')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
    loadMessages(); // Re-fetch to get profile info
  })
  .subscribe();

// Init
await getUser();
await loadMessages();

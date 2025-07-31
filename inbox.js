import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Setup
const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; // Replace with secure env key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const user = await supabase.auth.getUser();
const currentUserId = user.data.user.id;
const adminId = '081ee8b0-334c-4446-a8f0-bccfba864f6c';

async function sendChatMessage() {
  const content = document.getElementById("chat-input").value;
  const { error } = await supabase.from("messages").insert([{
    sender_id: currentUserId,
    receiver_id: adminId,
    content,
    is_admin: false
  }]);
  if (!error) document.getElementById("chat-input").value = "";
}

async function loadMessages() {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .order("timestamp", { ascending: true });

  const chatLog = document.getElementById("chat-log");
  chatLog.innerHTML = data.map(msg => `
    <div class="${msg.is_admin ? 'admin-msg' : 'user-msg'}">
      ${msg.content}
    </div>
  `).join("");
}

setInterval(loadMessages, 3000); // Poll every 3s

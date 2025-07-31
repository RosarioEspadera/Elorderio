import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Setup
const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; // Replace with secure env key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const user = await supabase.auth.getUser();
const currentUserId = user.data.user.id;
const adminId = '081ee8b0-334c-4446-a8f0-bccfba864f6c';

window.sendChatMessage = async function () {
  const content = document.getElementById("chat-input").value;
  const { error } = await supabase.from("messages").insert([{
    sender_id: currentUserId,
    receiver_id: adminId,
    content,
    is_admin: false
  }]);
  if (!error) document.getElementById("chat-input").value = "";
};

// Fetch distinct senders who messaged admin
if (currentUserId === adminId) {
  const { data: senders } = await supabase
    .from("messages")
    .select("sender_id", { distinct: true })
    .eq("receiver_id", adminId)
    .neq("sender_id", adminId);

  senders.forEach(({ sender_id }) => {
    const btn = document.createElement("button");
    btn.textContent = `Reply to ${sender_id.slice(0, 6)}...`;
    btn.onclick = () => loadConversation(sender_id);
    document.getElementById("sender-list").appendChild(btn);
  });
}

async function loadConversation(customerId) {
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${customerId},receiver_id.eq.${customerId}`)
    .order("timestamp", { ascending: true });

  const chatLog = document.getElementById("chat-log");
  chatLog.innerHTML = "";
  messages.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.className = msg.sender_id === adminId ? "admin-bubble" : "user-bubble";
    bubble.textContent = msg.content;
    chatLog.appendChild(bubble);
  });

  // Store selected customer for replies
  window.selectedCustomerId = customerId;
}
window.sendAdminReply = async function () {
  const content = document.getElementById("chat-input").value;
  await supabase.from("messages").insert([{
    sender_id: adminId,
    receiver_id: window.selectedCustomerId,
    content,
    is_admin: true
  }]);
  document.getElementById("chat-input").value = "";
  loadConversation(window.selectedCustomerId); // Refresh view
};

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

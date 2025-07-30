// ✅ Initialize Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

// 🔐 Check authentication
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirectToAuth();

  const user = session.user;
  document.getElementById('user-email').innerText = user.email;
  await loadUserAvatar(user.id);
});

// 🔀 Redirect
function redirectToAuth() {
  window.location.href = 'auth.html';
}

// 📦 Load avatar
async function loadUserAvatar(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', userId)
    .limit(1) // safer than .single() for fallback
    .maybeSingle(); // returns null instead of throwing

  if (error) {
    console.error("Avatar fetch failed:", error.message);
    return;
  }

  if (data?.avatar_url) {
    document.getElementById('avatar-preview').src = data.avatar_url;
  }
}

// 📤 Upload avatar
export async function uploadAvatar() {
  const file = document.getElementById('avatar-upload')?.files[0];
  if (!file) return alert("Please choose a photo.");

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return alert("User not found.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) return alert(`Upload failed: ${uploadError.message}`);

  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', user.id);

  if (dbError) return alert(`DB update failed: ${dbError.message}`);

  document.getElementById('avatar-preview').src = publicUrl;
  alert("Avatar updated!");
}

// 🚪 Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) return alert("Failed to logout. Try again.");

  redirectToAuth();
}

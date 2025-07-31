// 1️⃣ Initialize Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const emailLabel    = document.getElementById('user-email');
const avatarInput   = document.getElementById('avatar-upload');
const avatarPreview = document.getElementById('avatar-preview');
const uploadBtn     = document.getElementById('upload-button');
const logoutBtn     = document.getElementById('logout-button');

// 3️⃣ Redirect helper
function redirectToAuth() {
  window.location.href = './auth.html'; // ✅ safe for GitHub Pages
}

// 4️⃣ Page bootstrap
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirectToAuth();

  const user = session.user;
  emailLabel.textContent = user.email;

  await loadProfile(user.id);

  avatarInput.addEventListener('change', uploadAvatar);
  uploadBtn.addEventListener('click', uploadAvatar);
  logoutBtn.addEventListener('click', logout);
});

// 5️⃣ Load profile avatar
async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile:', error.message);
    return;
  }

  if (data?.avatar_url) {
    avatarPreview.src = data.avatar_url;
  }
}

// 6️⃣ Upload avatar
export async function uploadAvatar() {
  const file = avatarInput.files[0];
  if (!file) return alert('Please choose a photo to upload.');

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    console.error('No user:', userErr);
    return alert('You must be logged in to update your avatar.');
  }

  const ext = file.name.split('.').pop();
  const storagePath = `${user.id}.${ext}`;

  const { error: uploadErr } = await supabase
    .storage
    .from('avatars')
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600'
    });

  if (uploadErr) {
    console.error('Upload error:', uploadErr);
    return alert(`Upload failed: ${uploadErr.message}`);
  }

  const { data: urlData, error: urlErr } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(storagePath);

  if (urlErr || !urlData?.publicUrl) {
    console.error('Public URL error:', urlErr);
    return alert(`Could not get URL: ${urlErr?.message}`);
  }

  const publicUrl = urlData.publicUrl;

  const { error: dbErr } = await supabase
    .from('profiles')
    .upsert(
      { user_id: user.id, avatar_url: publicUrl },
      { onConflict: 'user_id' }
    );

  if (dbErr) {
    console.error('DB upsert error:', dbErr);
    return alert(`Could not save avatar: ${dbErr.message}`);
  }

  avatarPreview.src = publicUrl;
  alert('Avatar updated! 🎉');
}

// 7️⃣ Logout
export async function logout() {
  const { data: session } = await supabase.auth.getSession();

  if (session?.access_token) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
      return alert('Logout failed. Try again.');
    }
    alert('Logged out successfully.');
  } else {
    console.warn('No active session to log out.');
    alert('Session already expired.');
  }

  redirectToAuth();
}

// 1️⃣ Initialize Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2️⃣ Cache DOM references
const emailLabel     = document.getElementById('user-email');
const avatarInput    = document.getElementById('avatar-upload');
const avatarPreview  = document.getElementById('avatar-preview');
const uploadButton   = document.getElementById('upload-button');
const logoutButton   = document.getElementById('logout-button');

// 3️⃣ Boot sequence
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // check session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirectToAuth();

  // show user email
  const { user } = session;
  emailLabel.textContent = user.email;

  // load existing avatar
  await loadUserAvatar(user.id);

  // wire up events
  avatarInput.addEventListener('change',  uploadAvatar);
  uploadButton.addEventListener('click', uploadAvatar);
  logoutButton.addEventListener('click', logout);
}

// 4️⃣ Redirect helper
function redirectToAuth() {
  window.location.href = 'auth.html';
}

// 5️⃣ Fetch & display avatar
async function loadUserAvatar(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Avatar fetch failed:', error);
    return;
  }
  if (data?.avatar_url) {
    avatarPreview.src = data.avatar_url;
  }
}

// 6️⃣ Upload handler (for both “change” and “click”)
export async function uploadAvatar() {
  // 6.1 grab file from input
  const file = avatarInput.files[0];
  if (!file) {
    return alert('Please choose a photo.');
  }

  // 6.2 retrieve current user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    console.error('getUser error:', userErr);
    return alert('User not authenticated.');
  }

  // 6.3 build a stable filename
  const ext      = file.name.split('.').pop();
  const fileName = `${user.id}.${ext}`;

  // 6.4 upload to Supabase Storage (avatars bucket)
  const { error: uploadErr } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600'
    });

  if (uploadErr) {
    console.error('Upload error:', uploadErr);
    return alert(`Upload failed: ${uploadErr.message}`);
  }

  // 6.5 get the public URL for that file
  const { data: urlData, error: urlErr } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName);

  if (urlErr) {
    console.error('getPublicUrl error:', urlErr);
    return alert(`Could not retrieve avatar URL: ${urlErr.message}`);
  }
  const publicUrl = urlData.publicUrl;

  // 6.6 persist the URL in your profiles table
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', user.id);

  if (dbErr) {
    console.error('DB update failed:', dbErr);
    return alert(`Saving avatar URL failed: ${dbErr.message}`);
  }

  // 6.7 update UI
  avatarPreview.src = publicUrl;
  alert('Avatar updated! 🎉');
}

// 7️⃣ Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign-out error:', error);
    return alert('Failed to logout. Try again.');
  }
  redirectToAuth();
}

// 1️⃣ Initialize Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://bcmibfnrydyzomootwcb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM refs
const emailLabel    = document.getElementById('user-email');
const avatarInput   = document.getElementById('avatar-upload');
const avatarPreview = document.getElementById('avatar-preview');
const uploadBtn     = document.getElementById('upload-button');
const logoutBtn     = document.getElementById('logout-button');

// Bootstraps the page
window.addEventListener('DOMContentLoaded', init);

async function init() {
  const { data: session } = await supabase.auth.getSession();
if (session) {
  await supabase.auth.signOut();
  window.location.href = "/auth.html"; // or wherever you redirect
} else {
  console.warn("No active session to log out.");
  window.location.href = "/auth.html"; // still redirect gracefully
}

  const user = session.user;
  emailLabel.textContent = user.email;

  // load existing profile (if any)
  await loadProfile(user.id);

  // wire events
  avatarInput.addEventListener('change',  uploadAvatar);
  uploadBtn.addEventListener('click',    uploadAvatar);
  logoutBtn.addEventListener('click',    logout);
}

function redirectToAuth() {
  window.location.href = 'auth.html';
}

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

export async function uploadAvatar() {
  const file = avatarInput.files[0];
  if (!file) return alert('Please choose a photo to upload.');

  // get current user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    console.error('No user:', userErr);
    return alert('You must be logged in to update your avatar.');
  }

  // build filename
  const ext      = file.name.split('.').pop();
  const storagePath = `${user.id}.${ext}`;

  // 1) upload to storage
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

  // 2) get a public URL
  const { data: urlData, error: urlErr } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(storagePath);

  if (urlErr || !urlData?.publicUrl) {
    console.error('Public URL error:', urlErr);
    return alert(`Could not get URL: ${urlErr?.message}`);
  }
  const publicUrl = urlData.publicUrl;

  // 3) upsert into profiles table
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

  // 4) refresh preview
  avatarPreview.src = publicUrl;
  alert('Avatar updated! 🎉');
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout failed:', error);
    return alert('Logout failed. Try again.');
  }
  redirectToAuth();
}

// ✅ Initialize Supabase client
const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

// 🔐 Check authentication on page load
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirectToAuth();

  displayUserEmail(session.user);
  loadUserAvatar(session.user.id);
});

// 🔀 Redirect helper
function redirectToAuth() {
  window.location.href = 'auth.html';
}

// 📨 Show email
function displayUserEmail(user) {
  document.getElementById('user-email').innerText = user.email;
}

// 📦 Load avatar
async function loadUserAvatar(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();

  if (error) return console.error("Avatar fetch failed:", error.message);

  if (data?.avatar_url) {
    document.getElementById('avatar-preview').src = data.avatar_url;
  }
}

// 📤 Upload avatar
async function uploadAvatar() {
  const fileInput = document.getElementById('avatar-upload');
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a photo.");

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return alert("User not found.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}.${fileExt}`;
  const filePath = fileName;

  // 🚀 Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) return alert(`Upload failed: ${uploadError.message}`);

  // 🌐 Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);
  const imageURL = urlData?.publicUrl;

  // 🧾 Update profile
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: imageURL })
    .eq('id', user.id);

  if (dbError) return alert(`DB update failed: ${dbError.message}`);

  document.getElementById('avatar-preview').src = imageURL;
  alert("Avatar updated!");
}

// 🚪 Logout
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
    alert("Failed to logout. Try again.");
    return;
  }
  redirectToAuth();
}

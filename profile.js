// ✅ Initialize Supabase client
const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

// 🔐 Check authentication on page load
window.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    window.location.href = 'auth.html';
    return;
  }

  // 📨 Show user email
  document.getElementById('user-email').innerText = session.user.email;

  // 📦 Load existing avatar if available
  const { data: profileData } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', session.user.id)
    .single();

  if (profileData?.avatar_url) {
    document.getElementById('avatar-preview').src = profileData.avatar_url;
  }
});

// 📤 Upload avatar function
async function uploadAvatar() {
  const fileInput = document.getElementById('avatar-upload');
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a photo.");

  const { data: { user } } = await supabase.auth.getUser();
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}.${fileExt}`;
  const filePath = fileName;

  // 🚀 Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error(uploadError.message);
    return alert("Upload failed.");
  }

  // 🌐 Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const imageURL = urlData?.publicUrl;

  // 🧾 Update avatar URL in profiles
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: imageURL })
    .eq('id', user.id);

  if (dbError) {
    console.error(dbError.message);
    return alert("Failed to save avatar.");
  }

  document.getElementById('avatar-preview').src = imageURL;
  alert("Avatar updated!");
}

// 🚪 Logout function
function logout() {
  supabase.auth.signOut().then(() => {
    window.location.href = 'auth.html';
  });
}

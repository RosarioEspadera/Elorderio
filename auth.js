// auth.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  'https://bcmibfnrydyzomootwcb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'
);

// ——————————————————————————————————————————————————
// Grab DOM nodes
// ——————————————————————————————————————————————————
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginButton');
  loginBtn?.addEventListener('click', login);

  checkAndCreateProfile(); // Run after login if user is confirmed
});

async function login() {
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(`Login failed: ${error.message}`);
  } else {
    window.location.href = 'profile.html';
  }
}

async function checkAndCreateProfile() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingProfile) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      user_id: user.id,
      email: user.email,
      username: user.user_metadata?.name || 'New User'
    });

    if (insertError) {
      console.error('Profile insert error:', insertError);
    } else {
      console.log('Profile created successfully.');
    }
  }
}


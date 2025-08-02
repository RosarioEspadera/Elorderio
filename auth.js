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
  loginBtn?.addEventListener('click', handleLogin);
  
  const loginModal = document.getElementById('LogInModal');
  loginModal?.showModal(); // Show the modal when page loads

  checkAndCreateProfile(); // Ensure profile exists if already logged in
});


// ——————————————————————————————————————————————————
// Login Handler
// ——————————————————————————————————————————————————
async function handleLogin() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(`Login failed: ${error.message}`);
    } else {
      window.location.href = 'profile.html';
    }
  } catch (err) {
    console.error('Unexpected login error:', err);
    alert('Something went wrong. Please try again.');
  }
}

// ——————————————————————————————————————————————————
// Profile Check & Creation
// ——————————————————————————————————————————————————
async function checkAndCreateProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        username: user.user_metadata?.name || 'New User'
      });

      if (insertError) {
        console.error('Profile creation failed:', insertError);
      } else {
        console.log('Profile created successfully.');
      }
    }
  } catch (err) {
    console.error('Unexpected profile check error:', err);
  }
}


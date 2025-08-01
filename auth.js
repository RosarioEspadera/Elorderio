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
  const showSignupLink = document.getElementById('showSignupLink');
  const signupSection = document.getElementById('signup-section');

  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }

  if (showSignupLink && signupSection) {
    showSignupLink.addEventListener('click', e => {
      e.preventDefault();
      signupSection.classList.remove('hidden');
      showSignupLink.closest('p').classList.add('hidden');
    });
  }
});

// ——————————————————————————————————————————————————
// Login Handler
// ——————————————————————————————————————————————————
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

// ——————————————————————————————————————————————————
// Sign-Up Handler
// ——————————————————————————————————————————————————
window.signUp = async function () {
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value.trim();

  if (!email || !password) {
    alert('Please fill out all fields.');
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert(`Signup failed: ${error.message}`);
    return;
  }

  if (data?.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      user_id: data.user.id,
      email: data.user.email
    });

    alert('Account created! Please check your inbox to confirm.');
  }
};

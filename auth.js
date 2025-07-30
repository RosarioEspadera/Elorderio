// auth.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  'https://bcmibfnrydyzomootwcb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9yeWR5em9ttygIyAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MzgwODczNCwiZXhwIjoyMDY5Mzg0NzM0fQ.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'
);

// ——————————————————————————————————————————————————
// Grab DOM nodes
// ——————————————————————————————————————————————————
const showSignupLink = document.getElementById('show-signup');
const signupSection  = document.getElementById('signup-section');

// Reveal the Sign-Up form when the user clicks “Create one”
showSignupLink.addEventListener('click', e => {
  e.preventDefault();
  signupSection.classList.remove('hidden');
  showSignupLink.closest('p').classList.add('hidden');
});

// ——————————————————————————————————————————————————
// Login Handler
// ——————————————————————————————————————————————————
window.login = async function () {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(`Login failed: ${error.message}`);
    return;
  }

  // Redirect on success
  window.location.href = 'profile.html';
};

// ——————————————————————————————————————————————————
// Sign-Up Handler
// ——————————————————————————————————————————————————
window.signUp = async function () {
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert(`Sign-up failed: ${error.message}`);
    return;
  }

  alert('Account created! Please check your inbox to confirm.');
};

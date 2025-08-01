import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  'https://bcmibfnrydyzomootwcb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I'
);

window.signUp = async function () {
  const name = document.getElementById('full-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value.trim();

  if (!name || !email || !password) {
    alert('Please fill out all fields.');
    return;
  }

  console.log('Signing up with:', { name, email });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name } // Stored in user_metadata
    }
  });

  if (error) {
    console.error('Signup error:', error);
    alert(`Signup failed: ${error.message}`);
    return;
  }

  alert('Account created! Please check your inbox to confirm your email.');

  // Optional: redirect to login or confirmation page
  window.location.href = 'auth.html';
};

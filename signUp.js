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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    alert(`Signup failed: ${error.message}`);
    return;
  }

  if (data?.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      user_id: data.user.id,
      email: data.user.email,
      username: name
    });

    alert('Account created! Please check your inbox to confirm.');
    window.location.href = 'profile.html';
  }
};

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

  // Step 1: Sign up the user with metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name } // this sets user_metadata.name
    }
  });

  if (error) {
    alert(`Signup failed: ${error.message}`);
    return;
  }

  const user = data?.user;

  // Step 2: Insert into profiles table
  if (user) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        username: name
      });
    }
  }

  alert('Account created! Please check your inbox to confirm your email.');
  window.location.href = 'auth.html';
};

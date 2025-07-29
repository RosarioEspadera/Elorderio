const supabase = createClient('https://bcmibfnrydyzomootwcb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbWliZm5yeWR5em9tb290d2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3MzQsImV4cCI6MjA2OTM4NDczNH0.bu4jf3dH07tvgUcL0laZJnmLGL6nPDo4Q9XRCXTBO9I');

// 🔐 Login function
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login failed: " + error.message);
    console.error(error);
  } else {
    window.location.href = 'profile.html';
  }
}

// ✍️ Signup function (optional)
async function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error, data } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert("Signup failed: " + error.message);
    console.error(error);
  } else {
    alert("Account created! Check your inbox to confirm.");
  }
}

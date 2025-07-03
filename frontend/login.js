function togglePassword() {
  const passwordInput = document.querySelector('.password-input');
  const toggleBtn = document.querySelector('.password-toggle');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = '👁';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = '👁';
  }
}

function forgotPassword() {
  alert('Forgot Password functionality would redirect to password reset page');
}

function signUp() {
  window.location.href = 'register.html';
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const phone = document.querySelector('.mobile-input').value.trim();
  const password = document.querySelector('.password-input').value.trim();
  const user_type = document.getElementById('user_type').value;

  if (!phone || !password || !user_type) {
    alert('❌ Please fill in all required fields including user type');
    return;
  }

  fetch('https://loadconnect-backend-1.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password, user_type })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('✅ Login successful!');

        // Save user info in localStorage
        localStorage.setItem('loadconnectUser', JSON.stringify(data.user));
        localStorage.setItem('token', data.token); // Optional: useful for protected APIs

        // Redirect based on role
        if (data.user.role === 'customer') {
          window.location.href = 'customer-dashboard.html';
        } else if (data.user.role === 'operator') {
          window.location.href = 'operator-dashboard.html';
        }
      } else {
        alert('❌ ' + (data.message || 'Invalid credentials.'));
      }
    })
    .catch(err => {
      console.error('Login error:', err);
      alert('⚠ Server error. Please try again later.');
    });
});

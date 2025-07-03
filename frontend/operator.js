// Alert to confirm JS is loaded
alert("✅ operator.js loaded");

// File upload UI preview update
document.getElementById('fileUpload').addEventListener('change', function (e) {
  const files = e.target.files;
  const uploadArea = e.target.parentElement;

  if (files.length > 0) {
    uploadArea.innerHTML = `
      <input type="file" id="fileUpload" name="documents" multiple accept=".pdf,.doc,.docx,.jpg,.png" style="display: none;">
      <p>${files.length} file(s) selected</p>
      <small>Click to change selection</small>
    `;
    uploadArea.onclick = () => document.getElementById('fileUpload').click();
  }
});

// Captcha generation
function generateCaptcha() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let captcha = '';
  for (let i = 0; i < 5; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('captchaText').textContent = captcha;
}

// Form submission logic
document.getElementById('registrationForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  console.log("🧾 Form submit triggered");

  // Captcha check
  const enteredCaptcha = document.querySelector('input[name="captcha"]').value.toUpperCase();
  const actualCaptcha = document.getElementById('captchaText').textContent;
  if (enteredCaptcha !== actualCaptcha) {
    alert('Captcha does not match. Please try again.');
    generateCaptcha();
    return;
  }

  // Required field validation
  const requiredFields = document.querySelectorAll('input[required], select[required]');
  let isValid = true;
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.style.border = '1px solid #e74c3c';
      isValid = false;
    } else {
      field.style.border = '1px solid #ddd';
    }
  });

  if (!document.getElementById('agreement').checked) {
    alert('Please agree to the Terms & Conditions');
    return;
  }

  if (!isValid) {
    alert('Please fill in all required fields');
    return;
  }

  // Password check
  const password = document.querySelector('input[name="password"]').value;
  const confirmPassword = document.querySelector('input[name="confirmPassword"]').value;

  if (!password || !confirmPassword || password !== confirmPassword) {
    alert("❌ Passwords do not match or are missing.");
    return;
  }

  // Prepare FormData
  const formElement = document.getElementById('registrationForm');
  const formData = new FormData(formElement);

  // Debug form content
  console.log("📤 FormData Preview:");
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  // Send to backend
  try {
    const response = await fetch('https://loadconnect-backend-1.onrender.com/api/operator/register', {
      method: 'POST',
      body: formData // multipart/form-data is handled automatically
    });

    console.log("📡 Response Status:", response.status);
    const data = await response.json();
    console.log("📥 Response Data:", data);

    if (data.success) {
      alert('✅ Operator registered successfully!');
      window.location.href = 'Login.html';
    } else {
      alert('❌ Registration failed: ' + (data.message || 'Unknown error.'));
    }
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    alert('⚠️ Something went wrong. Please try again later.');
  }
});

// Generate initial captcha
generateCaptcha();

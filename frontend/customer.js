document.addEventListener("DOMContentLoaded", function () {
  // ✅ Generate Captcha
  function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('captchaText').textContent = captcha;
  }

  generateCaptcha(); // Generate on page load

  // ✅ Form Submission
  document.getElementById('registrationForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // ✅ Captcha check
    const enteredCaptcha = document.querySelector('input[name="captcha"]').value.toUpperCase();
    const actualCaptcha = document.getElementById('captchaText').textContent;

    if (enteredCaptcha !== actualCaptcha) {
      alert('Captcha does not match. Please try again.');
      generateCaptcha();
      return;
    }

    // ✅ Required fields validation
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

    if (!isValid) {
      alert('Please fill in all required fields');
      return;
    }

    // ✅ Terms & Conditions check
    if (!document.getElementById('agreement').checked) {
      alert('Please agree to the Terms & Conditions');
      return;
    }

    // ✅ Get form reference
    const form = document.getElementById('registrationForm');

    // ✅ Aadhaar number format check
    const aadharNo = form.querySelector('input[name="aadharNo"]').value.trim();
    if (!/^\d{12}$/.test(aadharNo)) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    // ✅ Password check
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirmPassword"]').value;

    if (!password || !confirmPassword || password !== confirmPassword) {
      alert("Passwords do not match or are missing.");
      return;
    }

    // ✅ FormData collection
    const formData = new FormData(form); // Automatically includes Aadhaar file

    try {
      const response = await fetch('https://loadconnect-backend-1.onrender.com/api/customer/register', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Customer registered successfully!');
        window.location.href = 'Login.html';
      } else {
        alert('❌ Registration failed: ' + (data.message || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('⚠ Something went wrong. Please try again later.');
    }
  });
});

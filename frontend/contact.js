const captchaCodes = ['5DJ3', '8KL7', 'M9P2', 'Q4R6', 'T1X5', 'Z8N3', 'B7V4', 'F2G9'];
        let currentCaptcha = '5DJ3';
        
        function refreshCaptcha() {
            const randomIndex = Math.floor(Math.random() * captchaCodes.length);
            currentCaptcha = captchaCodes[randomIndex];
            document.getElementById('captchaImage').textContent = currentCaptcha;
            document.getElementById('captchaInput').value = '';
        }
        
        document.getElementById('inquiryForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const captchaInput = document.getElementById('captchaInput').value;
            
            if (captchaInput !== currentCaptcha) {
                alert('CAPTCHA code is incorrect. Please try again.');
                refreshCaptcha();
                return;
            }
            
            alert('Form ready for backend integration!');
        });
        
        // Add some interactive effects
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('focus', function() {
                this.style.borderColor = '#4CAF50';
            });
            
            field.addEventListener('blur', function() {
                this.style.borderColor = '#ddd';
            });
        });
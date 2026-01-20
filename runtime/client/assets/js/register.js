document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const registerStatus = document.getElementById('register-status');

    // --- Inject Confirm Password Field ---
    const passwordInput = document.getElementById('register-password');
    if (passwordInput && !document.getElementById('register-password-confirm')) {
        const passwordField = passwordInput.closest('.field');
        if (passwordField) {
            const confirmField = document.createElement('div');
            confirmField.className = 'field';
            confirmField.innerHTML = `
                <label class="label">Confirm Password</label>
                <div class="control has-icons-left">
                    <input class="input" type="password" id="register-password-confirm" placeholder="Confirm Password" required>
                    <span class="icon is-small is-left">
                        <i class="fas fa-lock"></i>
                    </span>
                </div>
            `;
            passwordField.parentNode.insertBefore(confirmField, passwordField.nextSibling);
        }
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerStatus.classList.add('is-hidden');

            const firstName = document.getElementById('register-firstname').value;
            const lastName = document.getElementById('register-lastname').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPasswordInput = document.getElementById('register-password-confirm');

            if (confirmPasswordInput && password !== confirmPasswordInput.value) {
                registerStatus.className = 'notification is-danger';
                registerStatus.textContent = 'Passwords do not match.';
                registerStatus.classList.remove('is-hidden');
                return;
            }

            try {
                const response = await fetch('/api/customer/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, firstName, lastName })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Registration failed.');
                }

                // On success, switch to the login tab
                document.querySelector('[data-tab="login-tab"]').click();

                // Show success message on login tab
                const loginStatus = document.getElementById('login-status');
                if (loginStatus) {
                    loginStatus.className = 'notification is-success';
                    loginStatus.textContent = 'Registration successful! Please log in.';
                    loginStatus.classList.remove('is-hidden');
                }
            } catch (error) {
                registerStatus.className = 'notification is-danger';
                registerStatus.textContent = error.message;
            }
        });
    }
});
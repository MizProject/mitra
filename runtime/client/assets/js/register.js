document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const registerStatus = document.getElementById('register-status');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerStatus.classList.add('is-hidden');

            const firstName = document.getElementById('register-firstname').value;
            const lastName = document.getElementById('register-lastname').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

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

                // On success, show a success message and maybe switch to the login tab
                registerStatus.className = 'notification is-success';
                registerStatus.textContent = 'Registration successful! Please log in.';
                
                // Optional: Automatically switch to login tab after successful registration
                document.querySelector('[data-tab="login-tab"]').click();

            } catch (error) {
                registerStatus.className = 'notification is-danger';
                registerStatus.textContent = error.message;
            }
        });
    }
});
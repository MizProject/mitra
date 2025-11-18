document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const statusBox = document.getElementById('login-status');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = loginForm.querySelector('button');
            button.classList.add('is-loading');
            statusBox.classList.add('is-hidden');

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Login failed.');
                }

                // On success, redirect to the admin dashboard
                window.location.href = '/admin';

            } catch (error) {
                statusBox.textContent = error.message;
                statusBox.classList.remove('is-hidden');
            } finally {
                button.classList.remove('is-loading');
            }
        });
    }
});

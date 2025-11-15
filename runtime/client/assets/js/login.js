document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');
    const tabs = document.querySelectorAll('.tabs li');
    const tabContent = document.querySelectorAll('.content-tab');

    // --- Tab Switching Logic ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs
            tabs.forEach(item => item.classList.remove('is-active'));
            tabContent.forEach(content => content.style.display = 'none');

            // Activate the clicked tab
            tab.classList.add('is-active');
            const target = tab.dataset.tab;
            document.getElementById(target).style.display = 'block';
        });
    });

    // --- Login Form Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginStatus.classList.add('is-hidden');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/customer/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Login failed.');
                }

                // On success, you would typically save a session token
                // For now, we'll just show a success message and redirect to home.
                loginStatus.className = 'notification is-success';
                loginStatus.textContent = 'Login successful! Redirecting...';

                // Redirect to the home page after a short delay
                setTimeout(() => { window.location.href = '/'; }, 1500);

            } catch (error) {
                loginStatus.className = 'notification is-danger';
                loginStatus.textContent = error.message;
            }
        });
    }
});
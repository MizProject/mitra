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

            // Hide status messages when switching tabs
            if (loginStatus) loginStatus.classList.add('is-hidden');
            const registerStatus = document.getElementById('register-status');
            if (registerStatus) registerStatus.classList.add('is-hidden');

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

    // --- UI Enhancements ---
    // Dynamically add branding and clean up navigation
    (async () => {
        try {
            const response = await fetch('/api/get-site-config');
            if (!response.ok) return;
            const config = await response.json();

            // 1. Inject Logo or Site Name at the top of the card
            if (config.page_logo || config.page_name) {
                const logoContainer = document.createElement('div');
                logoContainer.className = 'has-text-centered mb-4';
                
                if (config.page_logo) {
                    logoContainer.innerHTML = `<img src="${config.page_logo}" alt="${config.page_name || 'Logo'}" style="max-height: 80px;">`;
                } else {
                    logoContainer.innerHTML = `<h3 class="title is-4">${config.page_name}</h3>`;
                }
                
                const cardContent = document.querySelector('.card-content');
                const tabs = document.querySelector('.tabs');
                const box = document.querySelector('.box');

                if (cardContent) {
                    cardContent.insertBefore(logoContainer, cardContent.firstChild);
                } else if (tabs) {
                    tabs.parentNode.insertBefore(logoContainer, tabs);
                } else if (box) {
                    box.parentNode.insertBefore(logoContainer, box);
                }
            }

            // 2. Remove "Go back to main page" link
            const links = document.querySelectorAll('a[href="/"]');
            links.forEach(link => {
                const text = link.textContent.toLowerCase();
                if (text.includes('back') || text.includes('main page')) {
                    link.style.display = 'none';
                }
            });
        } catch (e) {
            console.warn('Login UI enhancement failed:', e);
        }
    })();
});
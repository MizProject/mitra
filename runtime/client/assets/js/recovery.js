document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
    const tabs = document.querySelectorAll('.tabs li');
    const tabContents = document.querySelectorAll('.content-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            const target = tab.dataset.tab;
            tabContents.forEach(content => {
                if (content.id === target) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });

    // Customer Recovery
    const custForm = document.getElementById('customer-recovery-form');
    const custStatus = document.getElementById('cust-status');

    custForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('cust-email').value;
        const phone_number = document.getElementById('cust-phone').value;
        const new_password = document.getElementById('cust-password').value;
        const btn = custForm.querySelector('button');

        btn.classList.add('is-loading');
        custStatus.classList.add('is-hidden');
        custStatus.className = 'notification is-hidden mt-3';

        try {
            const res = await fetch('/api/customer/reset-password-via-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone_number, new_password })
            });
            const data = await res.json();

            custStatus.classList.remove('is-hidden');
            if (res.ok) {
                custStatus.classList.add('is-success');
                custStatus.textContent = data.message;
                custForm.reset();
            } else {
                custStatus.classList.add('is-danger');
                custStatus.textContent = data.error;
            }
        } catch (err) {
            custStatus.classList.remove('is-hidden');
            custStatus.classList.add('is-danger');
            custStatus.textContent = 'An error occurred.';
        } finally {
            btn.classList.remove('is-loading');
        }
    });

    // Admin Recovery
    const adminForm = document.getElementById('admin-recovery-form');
    const adminStatus = document.getElementById('admin-status');

    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const recovery_code = document.getElementById('admin-code').value;
        const new_password = document.getElementById('admin-password').value;
        const btn = adminForm.querySelector('button');

        btn.classList.add('is-loading');
        adminStatus.classList.add('is-hidden');
        adminStatus.className = 'notification is-hidden mt-3';

        try {
            const res = await fetch('/api/admin/reset-password-with-recovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, recovery_code, new_password })
            });
            const data = await res.json();

            adminStatus.classList.remove('is-hidden');
            if (res.ok) {
                adminStatus.classList.add('is-success');
                adminStatus.textContent = data.message;
                adminForm.reset();
            } else {
                adminStatus.classList.add('is-danger');
                adminStatus.textContent = data.error;
            }
        } catch (err) {
            adminStatus.classList.remove('is-hidden');
            adminStatus.classList.add('is-danger');
            adminStatus.textContent = 'An error occurred.';
        } finally {
            btn.classList.remove('is-loading');
        }
    });
});
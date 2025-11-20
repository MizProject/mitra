document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const statusBox = document.getElementById('login-status');

    // --- Recovery Modal Elements ---
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const recoveryModal = document.getElementById('recovery-modal');
    const recoveryStatus = document.getElementById('recovery-status');
    const verifyButton = document.getElementById('verify-recovery-code-button');
    const resetButton = document.getElementById('reset-password-button');
    const recoveryStep1 = document.getElementById('recovery-step-1');
    const recoveryStep2 = document.getElementById('recovery-step-2');

    let verifiedUsername = ''; // To store the username after successful verification

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

    // --- Recovery Modal Logic ---
    if (forgotPasswordLink && recoveryModal) {
        const closeRecoveryModal = () => {
            recoveryModal.classList.remove('is-active');
            // Reset modal to its initial state
            recoveryStep1.classList.remove('is-hidden');
            recoveryStep2.classList.add('is-hidden');
            recoveryStatus.classList.add('is-hidden');
            recoveryModal.querySelectorAll('input').forEach(input => input.value = '');
        };

        forgotPasswordLink.addEventListener('click', () => {
            recoveryModal.classList.add('is-active');
        });

        recoveryModal.querySelector('.delete').addEventListener('click', closeRecoveryModal);
        recoveryModal.querySelector('.modal-background').addEventListener('click', closeRecoveryModal);

        // Step 1: Verify the recovery code
        verifyButton.addEventListener('click', async () => {
            verifyButton.classList.add('is-loading');
            recoveryStatus.classList.add('is-hidden');

            const username = document.getElementById('recovery-username').value;
            const recovery_code = document.getElementById('recovery-code').value;

            try {
                const response = await fetch('/api/admin/verify-recovery-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, recovery_code })
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Verification failed.');
                }

                // On success, move to the next step
                verifiedUsername = username; // Store the verified username
                recoveryStep1.classList.add('is-hidden');
                recoveryStep2.classList.remove('is-hidden');

            } catch (error) {
                recoveryStatus.textContent = error.message;
                recoveryStatus.className = 'notification is-danger mt-4';
            } finally {
                verifyButton.classList.remove('is-loading');
            }
        });

        // Step 2: Reset the password
        resetButton.addEventListener('click', async () => {
            resetButton.classList.add('is-loading');
            recoveryStatus.classList.add('is-hidden');

            const newPassword = document.getElementById('recovery-new-password').value;
            const confirmPassword = document.getElementById('recovery-confirm-password').value;
            const recoveryCode = document.getElementById('recovery-code').value; // Get the code again for the reset API

            if (newPassword !== confirmPassword) {
                recoveryStatus.textContent = 'New passwords do not match.';
                recoveryStatus.className = 'notification is-danger mt-4';
                resetButton.classList.remove('is-loading');
                return;
            }

            if (!verifiedUsername) {
                recoveryStatus.textContent = 'Verification step was skipped. Please start over.';
                recoveryStatus.className = 'notification is-danger mt-4';
                resetButton.classList.remove('is-loading');
                return;
            }

            try {
                const response = await fetch('/api/admin/reset-password-with-recovery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: verifiedUsername,
                        recovery_code: recoveryCode,
                        new_password: newPassword
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to reset password.');
                }

                // On final success, show message and close modal
                recoveryStatus.textContent = 'Password has been reset successfully. You can now log in with your new password.';
                recoveryStatus.className = 'notification is-success mt-4';
                setTimeout(() => {
                    closeRecoveryModal();
                }, 3000);

            } catch (error) {
                recoveryStatus.textContent = error.message;
                recoveryStatus.className = 'notification is-danger mt-4';
            } finally {
                resetButton.classList.remove('is-loading');
            }
        });
    }
});

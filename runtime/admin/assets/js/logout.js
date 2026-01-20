/**
 * Handles the admin logout process.
 */
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default anchor tag behavior

            try {
                const response = await fetch('/api/admin/logout', { method: 'POST' });

                if (response.ok) {
                    window.location.href = '/admin-login';
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('An error occurred during the logout process:', error);
            }
        });
    }
});

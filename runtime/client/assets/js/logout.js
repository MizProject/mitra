/**
 * Handles the customer logout process.
 */
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default anchor tag behavior

            try {
                const response = await fetch('/api/customer/logout', {
                    method: 'POST',
                });

                if (response.ok) {
                    // On successful logout, redirect to the customer login page.
                    window.location.href = '/login-customer';
                } else {
                    console.error('Logout failed. The server responded with an error.');
                }
            } catch (error) {
                console.error('An error occurred during the logout process:', error);
            }
        });
    }
});

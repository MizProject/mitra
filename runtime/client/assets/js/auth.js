// Auth's purpose is to check if the user is logged into the current session.
// This script is intended for protected pages like /home.

(async function() {
    try {
        const response = await fetch('/api/customer/session-status');
        if (!response.ok) {
            // If the API fails for any reason, assume not logged in for security.
            window.location.href = '/login-customer';
            return;
        }
        const session = await response.json();
        if (!session.loggedIn) {
            window.location.href = '/login-customer';
        }
    } catch (error) {
        console.error('Session check failed, redirecting to login.', error);
        window.location.href = '/login-customer';
    }
})();
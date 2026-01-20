// Redirect to /home if user is already logged in
(async function() {
    try {
        const response = await fetch('/api/customer/session-status');
        if (!response.ok) {
            // If the endpoint fails, just do nothing.
            return;
        }
        const session = await response.json();
        if (session.loggedIn) {
            window.location.href = '/home';
        }
    } catch (error) {
        console.warn('Could not check session status.', error);
    }
})();
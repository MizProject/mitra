// This script is for protected admin pages.
// It checks if an admin session is active and redirects to the login page if not.

(async function() {
    try {
        const response = await fetch('/api/admin/session-status');
        if (!response.ok) {
            window.location.href = '/admin-login';
            return;
        }
        const session = await response.json();
        if (!session.loggedIn) {
            window.location.href = '/admin-login';
        }
    } catch (error) {
        console.error('Admin session check failed, redirecting to login.', error);
        window.location.href = '/admin-login';
    }
})();

/**
 * Easter Egg: Navigates to the hidden about page.
 * Can be called from the browser's developer console on any admin page.
 */
function visit_about() { window.location.href = '/admin/about'; }

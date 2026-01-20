// Streamlined Authentication Logic

/**
 * Creates a new admin account.
 * @param {string} username The admin username.
 * @param {string} password The admin password.
 * @param {string|null} recovery_code The recovery code, if generated.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response.
 */
async function createAdminAccount(username, password, recovery_code) {
    try {
        const response = await fetch('/api/create-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, recovery_code })
        });

        const result = await response.json();
        return { ok: response.ok, ...result };

    } catch (error) {
        console.error('Error creating admin account:', error);
        return { ok: false, error: 'An unexpected network error occurred.' };
    }
}

/**
 * Authenticates an admin user.
 * @param {string} username The admin username.
 * @param {string} password The admin password.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response.
 */
async function loginAdmin(username, password) {
    if (!username || !password) {
        return { ok: false, error: "Username and password fields cannot be empty." };
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        return { ok: response.ok, ...result };

    } catch (error) {
        console.error('Error during login:', error);
        return { ok: false, error: 'An unexpected network error occurred.' };
    }
}

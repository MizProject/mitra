/**
 * Fetches the site's theme configuration and applies it globally as CSS variables.
 * If specific colors are not defined in the config, it falls back to defaults.
 */
async function applyThemeColors() {
    try {
        const response = await fetch('/api/get-site-config');
        if (!response.ok) {
            console.warn('Could not fetch site theme config. Using default colors.');
            setFallbackTheme();
            return;
        }

        const config = await response.json();

        // Use configured color or fall back to Bulma's default primary color (teal)
        const primaryColor = config.primary_color || '#00d1b2';
        // Use configured color or fall back to a sensible default (Bulma's primary text color)
        const secondaryColor = config.secondary_color || '#4a4a4a';

        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);

    } catch (error) {
        console.error('Error applying site theme:', error);
        setFallbackTheme();
    }
}

function setFallbackTheme() {
    document.documentElement.style.setProperty('--primary-color', '#00d1b2');
    document.documentElement.style.setProperty('--secondary-color', '#4a4a4a');
}

// Run the function as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', applyThemeColors);

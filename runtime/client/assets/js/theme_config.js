/**
 * Fetches the site's theme configuration and applies it globally as CSS variables.
 * If specific colors are not defined in the config, it falls back to defaults.
 */
async function applySiteBranding() {
    try {
        const response = await fetch('/api/get-site-config');
        if (!response.ok) {
            console.warn('Could not fetch site config. Using defaults.');
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

        // --- Apply Site Name and Logo ---
        const brandLogoLink = document.getElementById('navbar-brand-logo');
        if (config.page_name) {
            document.title = config.page_name; // Update page title
            if (brandLogoLink && !config.page_logo) {
                // Only set text if there's no logo
                brandLogoLink.innerHTML = `<strong class="is-size-4">${config.page_name}</strong>`;
            }
        }

        if (config.page_logo && brandLogoLink) {
            const logoImg = document.createElement('img');
            logoImg.src = config.page_logo;
            logoImg.alt = config.page_name || 'Logo';
            logoImg.style.maxHeight = '28px'; // Bulma navbar item height
            brandLogoLink.innerHTML = ''; // Clear text before adding image
            brandLogoLink.appendChild(logoImg);
        }

        // --- Apply Favicon ---
        const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
        if (config.page_logo) favicon.href = config.page_logo;

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
document.addEventListener('DOMContentLoaded', applySiteBranding);

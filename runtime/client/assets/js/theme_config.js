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
        
        applyThemeColor(primaryColor, 'primary');
        applyThemeColor(secondaryColor, 'secondary');

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
    applyThemeColor('#00d1b2', 'primary');
    applyThemeColor('#4a4a4a', 'secondary');
}

function getContrastColor(hex) {
    if (!hex) return '#ffffff';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

function applyThemeColor(color, type) {
    document.documentElement.style.setProperty(`--${type}-color`, color);
    const inverse = getContrastColor(color);
    document.documentElement.style.setProperty(`--${type}-inverse-color`, inverse);

    // Set Bulma specific HSL variables for the primary color to ensure deep integration
    if (type === 'primary') {
        const hsl = hexToHSL(color);
        document.documentElement.style.setProperty('--bulma-primary-h', `${hsl.h}deg`);
        document.documentElement.style.setProperty('--bulma-primary-s', `${hsl.s}%`);
        document.documentElement.style.setProperty('--bulma-primary-l', `${hsl.l}%`);
        document.documentElement.style.setProperty('--bulma-primary', color);
    }

    const styleId = `mitra-theme-styles-${type}`;
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .button.is-${type}, .tag.is-${type}, .notification.is-${type}, .file-cta, .hero.is-${type} {
            background-color: var(--${type}-color) !important;
            color: var(--${type}-inverse-color) !important;
            border-color: transparent !important;
        }
        .button.is-${type}:hover, .file-cta:hover {
            filter: brightness(0.95);
        }
        .button.is-${type}.is-outlined {
            background-color: transparent !important;
            border-color: var(--${type}-color) !important;
            color: var(--${type}-color) !important;
        }
        .button.is-${type}.is-outlined:hover {
            background-color: var(--${type}-color) !important;
            color: var(--${type}-inverse-color) !important;
        }
        .has-text-${type} {
            color: var(--${type}-color) !important;
        }
        a.has-text-${type}:hover {
            color: var(--${type}-color) !important;
            filter: brightness(0.8);
        }
    `;
    document.head.appendChild(style);
}

function hexToHSL(hex) {
    // Remove hash if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Run the function as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', applySiteBranding);

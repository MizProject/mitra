document.addEventListener('DOMContentLoaded', () => {
    const siteNameInput = document.getElementById('site-name');
    const currencySymbolInput = document.getElementById('currency-symbol');
    const openingTimeInput = document.getElementById('opening-time');
    const closingTimeInput = document.getElementById('closing-time');
    const logoInput = document.getElementById('site-logo');
    const bannerInput = document.getElementById('site-banner');
    const saveButton = document.getElementById('save-config-button');
    const statusBox = document.getElementById('config-status-box');

    let currentPrimaryColor = '#00d1b2';
    let currentSecondaryColor = '#4a4a4a';
    let removeLogoFlag = false;
    let removeBannerFlag = false;

    // --- Load Initial Config ---
    async function loadInitialConfig() {
        try {
            const response = await fetch('/api/get-site-config');
            if (!response.ok) throw new Error('Failed to load site configuration.');
            const config = await response.json();

            if (config.page_name) siteNameInput.value = config.page_name;
            if (config.currency_symbol) currencySymbolInput.value = config.currency_symbol;
            if (config.opening_time) openingTimeInput.value = config.opening_time;
            if (config.closing_time) closingTimeInput.value = config.closing_time;
            if (config.primary_color) currentPrimaryColor = config.primary_color;
            if (config.secondary_color) currentSecondaryColor = config.secondary_color;

            // Initialize color pickers with loaded values
            setupColorPicker('primary', currentPrimaryColor);
            setupColorPicker('secondary', currentSecondaryColor);

            // Inject Remove Buttons if images exist
            if (config.page_logo) {
                const container = document.createElement('div');
                container.className = 'mt-2 mb-4';
                container.innerHTML = `
                    <p class="is-size-7 mb-1">Current Logo:</p>
                    <div class="is-flex is-align-items-center">
                        <img src="${config.page_logo}" style="max-height: 40px; margin-right: 10px;">
                        <button type="button" class="button is-small is-danger is-outlined" id="remove-logo-btn">Remove</button>
                    </div>`;
                logoInput.parentNode.parentNode.appendChild(container);
                document.getElementById('remove-logo-btn').addEventListener('click', (e) => {
                    removeLogoFlag = true; e.target.closest('div').parentNode.remove();
                });
            }
            if (config.banner_image) {
                const container = document.createElement('div');
                container.className = 'mt-2 mb-4';
                container.innerHTML = `
                    <p class="is-size-7 mb-1">Current Banner:</p>
                    <div class="is-flex is-align-items-center">
                        <img src="${config.banner_image}" style="max-height: 60px; margin-right: 10px;">
                        <button type="button" class="button is-small is-danger is-outlined" id="remove-banner-btn">Remove</button>
                    </div>`;
                bannerInput.parentNode.parentNode.appendChild(container);
                document.getElementById('remove-banner-btn').addEventListener('click', (e) => {
                    removeBannerFlag = true; e.target.closest('div').parentNode.remove();
                });
            }

        } catch (error) {
            showStatus(error.message, 'is-danger');
        }
    }

    // --- Color Picker Setup ---
    const setupColorPicker = (type, initialColor) => {
        const colorPickerButton = document.getElementById(`color-picker-button-${type}`);
        const colorPickerCard = document.getElementById(`color-picker-card-${type}`);
        const pickerContainer = document.getElementById(`picker-container-${type}`);

        const updateButtonAppearance = (color) => {
            const hexColor = color.hex.slice(0, 7);
            colorPickerButton.style.backgroundColor = hexColor;
            colorPickerButton.style.color = color.rgba[3] > 0.5 && (color.rgba[0] * 0.299 + color.rgba[1] * 0.587 + color.rgba[2] * 0.114) > 186 ? '#000' : '#fff';
            colorPickerButton.textContent = hexColor;
        };

        const picker = new Picker({
            parent: pickerContainer,
            popup: false,
            alpha: false,
            editorFormat: 'hex',
            color: initialColor,
            onChange: updateButtonAppearance
        });

        picker.onDone = (color) => {
            const hexColor = color.hex.slice(0, 7);
            if (type === 'primary') {
                currentPrimaryColor = hexColor;
            } else {
                currentSecondaryColor = hexColor;
            }
            colorPickerCard.style.display = 'none';
        };

        colorPickerButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = colorPickerCard.style.display === 'none';
            colorPickerCard.style.display = isHidden ? 'block' : 'none';
        });

        updateButtonAppearance(picker.color); // Set initial button color
    };

    // --- Save Configuration Logic ---
    const showStatus = (message, type = 'is-info') => {
        statusBox.textContent = message;
        statusBox.className = `notification ${type}`;
    };

    saveButton.addEventListener('click', async () => {
        saveButton.classList.add('is-loading');
        showStatus('Saving configuration...', 'is-info');

        const formData = new FormData();
        formData.append('siteName', siteNameInput.value);
        formData.append('currencySymbol', currencySymbolInput.value);
        formData.append('openingTime', openingTimeInput.value);
        formData.append('closingTime', closingTimeInput.value);
        formData.append('primaryColor', currentPrimaryColor);
        formData.append('secondaryColor', currentSecondaryColor);
        formData.append('remove_logo', removeLogoFlag);
        formData.append('remove_banner', removeBannerFlag);

        if (logoInput.files[0]) {
            formData.append('logo', logoInput.files[0]);
        }
        if (bannerInput.files[0]) {
            formData.append('banner', bannerInput.files[0]);
        }

        try {
            const response = await fetch('/api/admin/site-config', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            showStatus(result.message, 'is-success');
            // Reload branding to reflect changes immediately
            if (window.applySiteBranding) {
                applySiteBranding();
            }
        } catch (error) {
            showStatus('Error saving configuration: ' + error.message, 'is-danger');
        } finally {
            saveButton.classList.remove('is-loading');
        }
    });

    // Hide color picker cards when clicking outside
    document.addEventListener('click', (e) => {
        const primaryCard = document.getElementById('color-picker-card-primary');
        const primaryButton = document.getElementById('color-picker-button-primary');
        const secondaryCard = document.getElementById('color-picker-card-secondary');
        const secondaryButton = document.getElementById('color-picker-button-secondary');

        if (!primaryCard || !secondaryCard) return;

        if (!primaryCard.contains(e.target) && e.target !== primaryButton) {
            primaryCard.style.display = 'none';
        }
        if (!secondaryCard.contains(e.target) && e.target !== secondaryButton) {
            secondaryCard.style.display = 'none';
        }
    });

    // --- Initial Load ---
    loadInitialConfig();
});
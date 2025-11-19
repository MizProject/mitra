document.addEventListener('DOMContentLoaded', () => {
    // Form elements for personal details
    const detailsForm = document.getElementById('details-form');
    const emailInput = document.getElementById('email');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const phoneInput = document.getElementById('phone-number');
    const saveDetailsButton = document.getElementById('save-details-button');
    const detailsStatus = document.getElementById('details-status');

    // Form elements for password change
    const passwordForm = document.getElementById('password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const savePasswordButton = document.getElementById('save-password-button');
    const passwordStatus = document.getElementById('password-status');

    // Form elements for address
    const addressFormContainer = document.getElementById('address-form-container');
    const addressForm = document.getElementById('address-form');
    const addressLine1Input = document.getElementById('address-line1');
    const addressLine2Input = document.getElementById('address-line2');
    const cityInput = document.getElementById('city');
    const stateProvinceInput = document.getElementById('state-province');
    const postalCodeInput = document.getElementById('postal-code');
    const countryInput = document.getElementById('country');
    const saveAddressButton = document.getElementById('save-address-button');
    const addressStatus = document.getElementById('address-status');
    /**
     * Fetches the current customer's details and populates the form.
     */
    async function loadCustomerDetails() {
        try {
            const response = await fetch('/api/customer/details');
            if (!response.ok) throw new Error('Could not fetch your details.');
            const customer = await response.json();

            emailInput.value = customer.email || '';
            firstNameInput.value = customer.first_name || '';
            lastNameInput.value = customer.last_name || '';
            phoneInput.value = customer.phone_number || '';

            // Populate address fields
            addressLine1Input.value = customer.address_line1 || '';
            addressLine2Input.value = customer.address_line2 || '';
            cityInput.value = customer.city || '';
            stateProvinceInput.value = customer.state_province || '';
            postalCodeInput.value = customer.postal_code || '';
            countryInput.value = customer.country || '';
        } catch (error) {
            showStatus(detailsStatus, error.message, 'is-danger');
        }
    }

    /**
     * Handles the submission of the personal details form.
     */
    detailsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        saveDetailsButton.classList.add('is-loading');

        const data = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            phoneNumber: phoneInput.value,
        };

        try {
            const response = await fetch('/api/customer/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            showStatus(detailsStatus, result.message, 'is-success');
        } catch (error) {
            showStatus(detailsStatus, error.message, 'is-danger');
        } finally {
            saveDetailsButton.classList.remove('is-loading');
        }
    });

    /**
     * Handles the submission of the password change form.
     */
    passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (newPasswordInput.value !== confirmPasswordInput.value) {
            showStatus(passwordStatus, 'New passwords do not match.', 'is-danger');
            return;
        }

        savePasswordButton.classList.add('is-loading');

        const data = {
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value,
        };

        try {
            const response = await fetch('/api/customer/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            showStatus(passwordStatus, result.message, 'is-success');
            passwordForm.reset(); // Clear the form on success
        } catch (error) {
            showStatus(passwordStatus, error.message, 'is-danger');
        } finally {
            savePasswordButton.classList.remove('is-loading');
        }
    });

    /**
     * Handles the submission of the address form.
     */
    addressForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        saveAddressButton.classList.add('is-loading');

        const data = {
            address_line1: addressLine1Input.value,
            address_line2: addressLine2Input.value,
            city: cityInput.value,
            state_province: stateProvinceInput.value,
            postal_code: postalCodeInput.value,
            country: countryInput.value,
        };

        try {
            const response = await fetch('/api/customer/update-address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            showStatus(addressStatus, result.message, 'is-success');
        } catch (error) {
            showStatus(addressStatus, error.message, 'is-danger');
        } finally {
            saveAddressButton.classList.remove('is-loading');
        }
    });

    /**
     * Checks service types and shows address form if 'hotel' is not one of them.
     */
    async function checkServiceTypesAndToggleAddressForm() {
        try {
            const response = await fetch('/api/get-service-types');
            if (!response.ok) return; // Fail silently, keep form hidden
            const serviceTypes = await response.json();

            // If 'hotel' is NOT one of the service types, show the address form.
            if (!serviceTypes.includes('hotel')) {
                addressFormContainer.style.display = 'block';
            }
        } catch (error) {
            console.error("Could not check service types:", error);
        }
    }


    /**
     * Helper function to display status messages in notification boxes.
     * @param {HTMLElement} element - The notification element.
     * @param {string} message - The message to display.
     * @param {string} type - The Bulma notification class (e.g., 'is-success', 'is-danger').
     */
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = `notification ${type}`;
        setTimeout(() => {
            element.classList.add('is-hidden');
        }, 5000); // Hide after 5 seconds
    }

    // Initial load
    checkServiceTypesAndToggleAddressForm();
    loadCustomerDetails();
});

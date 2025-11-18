// UI Framework of /home

/**
 * Checks if the logged-in customer has a phone number.
 * If not, it shows an alert. If yes, it executes a callback function.
 * @param {function} onValid - The function to call if the user has a phone number.
 */
async function checkPhoneNumberAndProceed(onValid) {
    try {
        const response = await fetch('/api/customer/details');
        const customer = await response.json();
        if (response.ok && customer && customer.phone_number) {
            onValid(); // User has a phone number, proceed.
        } else {
            alert('Please add a phone number to your profile before making a request.');
        }
    } catch (error) {
        console.error('Failed to check customer details:', error);
        alert('Could not verify your profile details. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const actionCardsContainer = document.getElementById('home-action-cards');
    const requestServiceCard = document.getElementById('request-service-card');

    if (actionCardsContainer) {
        // This function is defined in home-cards.js
        renderServiceActionCards(actionCardsContainer);
    }

    if (requestServiceCard) {
        requestServiceCard.addEventListener('click', () => {
            checkPhoneNumberAndProceed(() => {
                window.location.href = '/order-request';
            });
        });
    }
});

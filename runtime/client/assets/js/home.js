// UI Framework of /home

document.addEventListener('DOMContentLoaded', () => {
    const actionCardsContainer = document.getElementById('home-action-cards');

    if (actionCardsContainer) {
        // This function is defined in home-cards.js
        renderServiceActionCards(actionCardsContainer);
    }

});

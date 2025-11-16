/**
 * This module handles the creation of dynamic action cards on the home page
 * based on the services offered by the business.
 */

/**
 * Defines the content for each known service type.
 * This can be expanded as more service types are added.
 */
const serviceCardDefinitions = {
    'hotel': {
        title: 'Book a Stay',
        icon: 'fa-bed',
        description: 'Find and book available rooms for your next stay.',
        link: '/book/hotel' // Example link
    },
    'repair': {
        title: 'Schedule a Repair',
        icon: 'fa-tools',
        description: 'Book a time slot to get your device fixed by our experts.',
        link: '/book/repair'
    },
    'food': {
        title: 'Order Food',
        icon: 'fa-utensils',
        description: 'Browse our menu and place an order for pickup or delivery.',
        link: '/order/food'
    },
    'laundry': {
        title: 'Schedule Laundry Service',
        icon: 'fa-tshirt',
        description: 'Arrange for pickup and delivery of your laundry.',
        link: '/book/laundry'
    }
};

/**
 * Fetches available service types and renders the corresponding cards.
 * @param {HTMLElement} container - The container element to append the cards to.
 */
async function renderServiceActionCards(container) {
    try {
        const response = await fetch('/api/get-service-types');
        if (!response.ok) throw new Error('Could not fetch service types.');

        const serviceTypes = await response.json();

        if (serviceTypes.length === 0) {
            return; // Don't render anything if no specific services are found
        }

        serviceTypes.forEach(type => {
            const cardDef = serviceCardDefinitions[type];
            if (cardDef) {
                const column = document.createElement('div');
                column.className = 'column is-one-third';
                column.innerHTML = `
                    <div class="card is-clickable home-action-card">
                        <div class="card-content has-text-centered">
                            <span class="icon is-large has-text-primary"><i class="fas ${cardDef.icon} fa-2x"></i></span>
                            <p class="title is-4">${cardDef.title}</p>
                            <p>${cardDef.description}</p>
                        </div>
                    </div>
                `;
                container.appendChild(column);
            }
        });

    } catch (error) {
        console.error("Error rendering service action cards:", error);
    }
}

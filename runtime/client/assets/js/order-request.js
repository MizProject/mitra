document.addEventListener('DOMContentLoaded', () => {
    const formContainer = document.getElementById('dynamic-form-container');

    // Use the same definitions as the home page for consistency
    const serviceCardDefinitions = {
        'hotel': { title: 'Book a Stay', icon: 'fa-bed' },
        'repair': { title: 'Schedule a Repair', icon: 'fa-tools' },
        'food': { title: 'Order Food', icon: 'fa-utensils' },
        'laundry': { title: 'Schedule Laundry Service', icon: 'fa-tshirt' }
    };

    /**
     * Renders the initial selection screen where the user chooses a request type.
     */
    async function renderInitialSelection() {
        formContainer.innerHTML = `
            <h1 class="title">Request a Service</h1>
            <p class="subtitle">What would you like to do today?</p>
            <div class="columns is-multiline" id="request-type-cards"></div>
        `;
        const cardsContainer = document.getElementById('request-type-cards');

        // 1. Add the "Custom Order" option first
        const customOrderCard = createRequestTypeCard({
            type: 'custom',
            title: 'Submit a Custom Request',
            icon: 'fa-edit',
            description: 'For special inquiries or services not listed.'
        });
        customOrderCard.addEventListener('click', () => renderCustomOrderForm());
        cardsContainer.appendChild(customOrderCard);

        // 2. Fetch and add cards for all other available service types
        try {
            const response = await fetch('/api/get-service-types');
            if (!response.ok) throw new Error('Could not load service types.');
            const serviceTypes = await response.json();

            serviceTypes.forEach(type => {
                const def = serviceCardDefinitions[type];
                if (def) {
                    const card = createRequestTypeCard({
                        type: type,
                        title: def.title,
                        icon: def.icon,
                        description: `Submit a request for our ${type} services.`
                    });
                    // TODO: Add event listeners to render specific forms for each service type
                    card.addEventListener('click', () => alert(`The form for '${type}' is not yet implemented.`));
                    cardsContainer.appendChild(card);
                }
            });
        } catch (error) {
            console.error("Error rendering service cards:", error);
        }
    }

    /**
     * Helper function to create a clickable card for the selection screen.
     * @param {object} details - Card details { type, title, icon, description }.
     * @returns {HTMLElement} A column element containing the card.
     */
    function createRequestTypeCard(details) {
        const column = document.createElement('div');
        column.className = 'column is-one-third';
        column.innerHTML = `
            <div class="card is-clickable home-action-card" data-service-type="${details.type}">
                <div class="card-content has-text-centered">
                    <span class="icon is-large has-text-primary"><i class="fas ${details.icon} fa-2x"></i></span>
                    <p class="title is-4">${details.title}</p>
                    <p>${details.description}</p>
                </div>
            </div>
        `;
        return column;
    }

    /**
     * Renders the form for submitting a custom, non-standard order.
     */
    function renderCustomOrderForm() {
        formContainer.innerHTML = `
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li><a href="#" id="back-to-selection">Service Request</a></li>
                <li class="is-active"><a href="#" aria-current="page">Custom Request</a></li>
              </ul>
            </nav>

            <h2 class="title is-3">Custom Service Request</h2>
            <p class="subtitle">Describe what you need, and we'll get back to you with a quote.</p>

            <div class="field">
              <label class="label">Request Title</label>
              <div class="control">
                <input class="input" type="text" placeholder="e.g., 'Catering for a small event'">
              </div>
            </div>

            <div class="field">
              <label class="label">Details</label>
              <div class="control">
                <textarea class="textarea" placeholder="Please provide as much detail as possible, including dates, number of people, specific needs, etc."></textarea>
              </div>
            </div>

            <div class="field is-grouped">
              <div class="control"><button class="button is-primary">Submit Request</button></div>
              <div class="control"><button class="button is-light" id="cancel-custom-request">Cancel</button></div>
            </div>
        `;

        document.getElementById('back-to-selection').addEventListener('click', renderInitialSelection);
        document.getElementById('cancel-custom-request').addEventListener('click', renderInitialSelection);
    }

    // Start the process by showing the initial selection screen.
    renderInitialSelection();
});

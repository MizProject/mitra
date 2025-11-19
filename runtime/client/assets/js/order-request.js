document.addEventListener('DOMContentLoaded', () => {
    const formContainer = document.getElementById('dynamic-form-container');
    const serviceCardDefinitions = {
        'hotel': { title: 'Book a Stay', icon: 'fa-bed' },
        'repair': { title: 'Schedule a Repair', icon: 'fa-tools' },
        'food': { title: 'Order Food', icon: 'fa-utensils' },
        'laundry': { title: 'Schedule Laundry Service', icon: 'fa-tshirt' }
    };

    let cart = []; // Holds items for the current order request
    let currency = '$'; // Default Currency

    /**
     * Loads currency configuration
     * 
     */

    async function loadCurrency() {
        try {
            const response = await fetch('/api/get-site-config');
            const conf = await response.json();
            if (conf.currency_symbol) {
                currency = conf.currency_symbol;
            }
        } catch (e) {
            // Use default currency
        }
    }

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
                // Per request, only show laundry and food for now
                if (type !== 'laundry' && type !== 'food') {
                    return;
                }

                const def = serviceCardDefinitions[type];
                if (def) {
                    const card = createRequestTypeCard({
                        type: type,
                        title: def.title,
                        icon: def.icon,
                        description: `Build an order for our ${type} services.`
                    });

                    card.addEventListener('click', () => renderServiceOrderForm(type, def.title));
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
     * Renders a generic order form for a specific service type (e.g., food, laundry).
     * @param {string} serviceType - The type of service to render (e.g., 'food').
     * @param {string} title - The title for the page header.
     */
    async function renderServiceOrderForm(serviceType, title) {
        // If the service is laundry, render a more specialized form.
        if (serviceType === 'laundry') {
            renderLaundryOrderForm(title);
            return;
        }

        cart = []; // Reset cart for a new order
        formContainer.innerHTML = `
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li><a href="#" id="back-to-selection">Service Request</a></li>
                <li class="is-active"><a href="#" aria-current="page">${title}</a></li>
              </ul>
            </nav>
            <div class="columns">
                <div class="column is-two-thirds">
                    <h2 class="title is-3">${title}</h2>
                    <p class="subtitle">Select items to add to your order.</p>
                    <div id="service-item-list" class="columns is-multiline">
                        <progress class="progress is-large is-primary" max="100"></progress>
                    </div>
                </div>
                <div class="column is-one-third">
                    <div class="box" style="position: sticky; top: 20px;">
                        <h3 class="title is-4">Your Order</h3>
                        <div id="cart-summary">Your order is empty.</div>
                        <hr>
                        <p class="is-size-5 has-text-weight-bold">Total: ${currency}<span id="cart-total">0.00</span></p>
                        <hr>
                        <button class="button is-primary is-fullwidth" id="proceed-to-checkout" disabled>Proceed to Checkout</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('back-to-selection').addEventListener('click', renderInitialSelection);
        document.getElementById('proceed-to-checkout').addEventListener('click', proceedToCheckout);

        const itemListContainer = document.getElementById('service-item-list');
        try {
            const response = await fetch(`/api/get-services?type=${serviceType}`);
            if (!response.ok) throw new Error(`Could not load ${serviceType} items.`);
            const services = await response.json();

            itemListContainer.innerHTML = '';
            if (services.length === 0) {
                itemListContainer.innerHTML = `<p>No ${serviceType} services are available at this time.</p>`;
                return;
            }

            services.forEach(service => {
                const itemCard = document.createElement('div');
                itemCard.className = 'column is-half';
                itemCard.innerHTML = `
                    <div class="card">
                        <div class="card-content">
                            <p class="title is-5">${service.service_name}</p> 
                            <p class="subtitle is-6">${service.description || ''}</p>
                            <p class="has-text-weight-bold">${currency}${service.base_price.toFixed(2)}</p>
                        </div>
                        <footer class="card-footer">
                            <a href="#" class="card-footer-item add-to-cart-button" data-service-id="${service.service_id}" data-name="${service.service_name}" data-price="${service.base_price}" data-service-type="${service.service_type}">Add to Order</a>
                        </footer>
                    </div>
                `;
                itemListContainer.appendChild(itemCard);
            });

            itemListContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('add-to-cart-button')) {
                    event.preventDefault();
                    const serviceId = parseInt(event.target.dataset.serviceId, 10);
                    const name = event.target.dataset.name;
                    const price = parseFloat(event.target.dataset.price);
                    const type = event.target.dataset.serviceType;
                    addToCart(serviceId, name, price, type);
                }
            });

        } catch (error) {
            itemListContainer.innerHTML = `<p class="has-text-danger">${error.message}</p>`;
        }
    }

    /**
     * Renders a specialized form specifically for laundry services.
     * @param {string} title - The title for the page header.
     */
    async function renderLaundryOrderForm(title) {
        cart = []; // Reset cart
        formContainer.innerHTML = `
            <nav class="breadcrumb" aria-label="breadcrumbs">
              <ul>
                <li><a href="#" id="back-to-selection">Service Request</a></li>
                <li class="is-active"><a href="#" aria-current="page">${title}</a></li>
              </ul>
            </nav>
            <div class="columns">
                <div class="column is-two-thirds">
                    <h2 class="title is-3">${title}</h2>
                    <p class="subtitle">Specify the quantity for each type of laundry load. Prices are per load (kg).</p>
                    <div id="laundry-item-list">
                        <progress class="progress is-large is-primary" max="100"></progress>
                    </div>
                </div>
                <div class="column is-one-third">
                    <div class="box" style="position: sticky; top: 20px;">
                        <h3 class="title is-4">Your Order Summary</h3>
                        <div id="cart-summary">Your order is empty.</div>
                        <hr>
                        <p class="is-size-5 has-text-weight-bold">Total: ${currency}<span id="cart-total">0.00</span></p>
                        <hr>
                        <button class="button is-primary is-fullwidth" id="proceed-to-checkout" disabled>Proceed to Checkout</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('back-to-selection').addEventListener('click', renderInitialSelection);
        document.getElementById('proceed-to-checkout').addEventListener('click', proceedToCheckout);

        const itemListContainer = document.getElementById('laundry-item-list');
        try {
            const response = await fetch(`/api/get-services?type=laundry`);
            if (!response.ok) throw new Error('Could not load laundry services.');
            const services = await response.json();

            itemListContainer.innerHTML = '';
            if (services.length === 0) {
                itemListContainer.innerHTML = '<p>No laundry services are available at this time.</p>';
                return;
            }

            // Create a more interactive form for laundry
            services.forEach(service => {
                const itemRow = document.createElement('div');
                itemRow.className = 'box is-flex is-justify-content-space-between is-align-items-center mb-4';
                itemRow.innerHTML = `
                    <div>
                        <p class="title is-5">${service.service_name}</p>
                        <p class="subtitle is-6 has-text-weight-bold">${currency}${service.base_price.toFixed(2)} per load</p>
                    </div>
                    <div class="field has-addons">
                        <div class="control">
                            <button class="button quantity-change" data-service-id="${service.service_id}" data-action="decrease">-</button>
                        </div>
                        <div class="control">
                            <input class="input has-text-centered" type="number" value="0" min="0" readonly style="width: 60px;" data-service-id="${service.service_id}">
                        </div>
                        <div class="control">
                            <button class="button quantity-change" data-service-id="${service.service_id}" data-action="increase">+</button>
                        </div>
                    </div>
                `;
                itemListContainer.appendChild(itemRow);
            });

            itemListContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('quantity-change')) {
                    const button = event.target;
                    const serviceId = parseInt(button.dataset.serviceId, 10);
                    const action = button.dataset.action;
                    const service = services.find(s => s.service_id === serviceId);
                    const input = itemListContainer.querySelector(`input[data-service-id="${serviceId}"]`);

                    if (!service || !input) return;
                    
                    let quantity = parseInt(input.value, 10);

                    if (action === 'increase') {
                        quantity++;
                    } else if (action === 'decrease' && quantity > 0) {
                        quantity--;
                    }

                    input.value = quantity;

                    // Update the main cart array
                    const cartItem = cart.find(item => item.service_id === serviceId);
                    if (quantity > 0) {
                        if (cartItem) {
                            cartItem.quantity = quantity;
                        } else {
                            cart.push({ service_id: serviceId, name: service.service_name, price: service.base_price, quantity: quantity, service_type: 'laundry' });
                        }
                    } else if (cartItem) {
                        // Remove from cart if quantity is 0
                        cart = cart.filter(item => item.service_id !== serviceId);
                    }
                    updateCartSummary();
                }
            });

        } catch (error) {
            itemListContainer.innerHTML = `<p class="has-text-danger">${error.message}</p>`;
        }
    }

    /**
     * Adds an item to the cart and updates the summary UI.
     */
    function addToCart(serviceId, name, price, serviceType) {
        const existingItem = cart.find(item => item.service_id === serviceId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ service_id: serviceId, name, price, quantity: 1, service_type: serviceType });
        }
        updateCartSummary();
    }

    /**
     * Updates the order summary and total price on the UI.
     */
    function updateCartSummary() {
        const cartSummary = document.getElementById('cart-summary');
        const cartTotal = document.getElementById('cart-total');
        const checkoutButton = document.getElementById('proceed-to-checkout');

        if (cart.length === 0) {
            cartSummary.innerHTML = 'Your order is empty.';
            checkoutButton.disabled = true;
            cartTotal.textContent = '0.00';
            return;
        }

        let total = 0;
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.margin = '0';

        cart.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.quantity}x ${item.name}`;
            ul.appendChild(li);
            total += item.price * item.quantity;
        });

        cartSummary.innerHTML = '';
        cartSummary.appendChild(ul);
        cartTotal.textContent = total.toFixed(2);
        checkoutButton.disabled = false;
    }

    /**
     * Stores the cart in sessionStorage and redirects to the checkout page.
     */
    function proceedToCheckout() {
        if (cart.length > 0) {
            // Use sessionStorage to pass the cart data to the next page.
            // It's temporary and will be cleared when the browser tab is closed.
            sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
            window.location.href = '/checkout';
        } else {
            alert('Your cart is empty.');
        }
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
            <p class="subtitle">Describe your custom needs, and we'll get back to you with a quote or confirmation.</p>

            <form id="custom-request-form">
                <div class="field">
                    <label class="label">Request Title <span class="has-text-danger">*</span></label>
                    <div class="control">
                        <input class="input" type="text" id="custom-request-title" placeholder="e.g., 'Catering for a small event'" required>
                    </div>
                </div>

                <div class="field">
                    <label class="label">Details <span class="has-text-danger">*</span></label>
                    <div class="control">
                        <textarea class="textarea" id="custom-request-details" placeholder="Please provide as much detail as possible, including dates, number of people, specific needs, etc." rows="5" required></textarea>
                    </div>
                </div>

                <div class="field">
                    <label class="label">Preferred Contact Method</label>
                    <div class="control">
                        <label class="radio">
                            <input type="radio" name="contact-method" value="email" checked>
                            Email
                        </label>
                        <label class="radio">
                            <input type="radio" name="contact-method" value="phone">
                            Phone
                        </label>
                    </div>
                </div>

                <div class="field">
                    <label class="label">Preferred Date/Time (Optional)</label>
                    <div class="control">
                        <input class="input" type="datetime-local" id="custom-request-datetime">
                    </div>
                </div>

                <div class="field is-grouped">
                    <div class="control">
                        <button class="button is-primary" type="submit" id="submit-custom-request">Submit Request</button>
                    </div>
                    <div class="control">
                        <button class="button is-light" type="button" id="cancel-custom-request">Cancel</button>
                    </div>
                </div>
                <div class="notification is-hidden mt-4" id="custom-request-status"></div>
            </form>
        `;

        document.getElementById('back-to-selection').addEventListener('click', renderInitialSelection);
        document.getElementById('cancel-custom-request').addEventListener('click', renderInitialSelection);

        // Handle custom request submission
        document.getElementById('custom-request-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = document.getElementById('submit-custom-request');
            const statusBox = document.getElementById('custom-request-status');
            submitButton.classList.add('is-loading');
            statusBox.classList.add('is-hidden');

            const requestData = {
                title: document.getElementById('custom-request-title').value,
                details: document.getElementById('custom-request-details').value,
                contactMethod: document.querySelector('input[name="contact-method"]:checked').value,
                preferredDateTime: document.getElementById('custom-request-datetime').value,
            };

            console.log('Custom Request Submitted:', requestData);
            // In a real application, you would send this data to an API endpoint.
            // For now, we'll just simulate success.
            statusBox.className = 'notification is-success';
            statusBox.textContent = 'Your custom request has been submitted! We will contact you soon.';
            statusBox.classList.remove('is-hidden');
            submitButton.classList.remove('is-loading');
            // Optionally, clear the form or redirect
            // document.getElementById('custom-request-form').reset();
        });
    }

    /**
     * Initializes the page. If a service_type is in the URL, it renders
     * the specific form directly. Otherwise, it shows the initial selection screen.
     */
    function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceType = urlParams.get('service_type');
        const serviceDef = serviceCardDefinitions[serviceType];
 
        // Wait for the currency to load first, then render the page.
        loadCurrency().then(() => {
            if (serviceType && serviceDef) {
                renderServiceOrderForm(serviceType, serviceDef.title);
            } else {
                renderInitialSelection();
            }
        });
    }

    // Start the process.
    initializePage();
});

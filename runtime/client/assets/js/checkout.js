
document.addEventListener('DOMContentLoaded', () => { // This is now checkout.js
    const servicesContainer = document.getElementById('services-list-container');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartTotalCurrencyElement = document.getElementById('cart-total-currency');
    const placeOrderButton = document.getElementById('place-order-button');
    const orderStatus = document.getElementById('order-status');
    const pickupOptionsContainer = document.getElementById('pickup-options-container');
    const returnOptionsContainer = document.getElementById('return-options-container');

    let cart = []; // This will store our cart items: { service_id, name, price, quantity, service_type }
    let currency = '$'; // Default currency
    let customerDetails = {}; // To store customer address info


    /**
     * Fetches available services and renders them on the page.
     */
    async function loadServices() {
        // Check if a cart was passed from the order-request page
        const prefilledCart = sessionStorage.getItem('checkoutCart');

        // Fetch customer details to check for an address
        try {
            const response = await fetch('/api/customer/details');
            if (response.ok) {
                customerDetails = await response.json();
            }
        } catch (error) { console.error('Could not load customer details.', error); }


        // Fetch currency first
        try {
            const response = await fetch('/api/get-site-config');
            const config = await response.json();
            if (config.currency_symbol) {
                currency = config.currency_symbol;
                if (cartTotalCurrencyElement) cartTotalCurrencyElement.textContent = currency;
            }
        } catch (e) { /* Use default currency */ }

        if (prefilledCart) {
            cart = JSON.parse(prefilledCart);
            // Clear the item from session storage so it's not used again on a page refresh
            sessionStorage.removeItem('checkoutCart');
            document.getElementById('services-list-container').style.display = 'none'; // Hide service selection
            toggleDeliveryOptions(); // Show/hide delivery options based on cart contents
            document.querySelector('.column.is-two-thirds .title').textContent = 'Confirm Your Order';
            document.querySelector('.column.is-two-thirds .subtitle').textContent = 'Review the items from your request below.';
            renderCart();
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const serviceType = urlParams.get('service_type');

        let apiUrl = '/api/get-services';
        if (serviceType) {
            apiUrl += `?type=${serviceType}`;
        }
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to load services.');
            const services = await response.json();

            servicesContainer.innerHTML = ''; // Clear loader
            services.forEach(service => {
                const column = document.createElement('div');
                column.className = 'column is-one-third';
                column.innerHTML = `
                    <div class="card service-card">
                        <div class="card-image">
                            <figure class="image is-4by3">
                                <img src="${service.image_url || 'https://via.placeholder.com/640x480.png?text=No+Image'}" alt="${service.service_name}">
                            </figure>
                        </div>
                        <div class="card-content">
                            <p class="title is-4">${service.service_name}</p>
                            <p class="subtitle is-6">${service.description}</p>
                            <p class="has-text-weight-bold">Price: ${currency}${service.base_price.toFixed(2)}</p>
                        </div>
                        <footer class="card-footer">
                            <a href="#" class="card-footer-item add-to-cart-button" data-service-id="${service.service_id}" data-name="${service.service_name}" data-price="${service.base_price}">Add to Order</a>
                        </footer>
                    </div>
                `;
                servicesContainer.appendChild(column);
            });
        } catch (error) {
            servicesContainer.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    }

    /**
     * Adds an item to the cart or increments its quantity.
     */
    function addToCart(serviceId, name, price, serviceType) {
        const idAsNumber = parseInt(serviceId, 10);
        const existingItem = cart.find(item => item.service_id === idAsNumber);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ service_id: idAsNumber, name, price, quantity: 1, service_type: serviceType });
        }
        renderCart();
    }

    /**
     * Renders the current state of the cart to the UI.
     */
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<li>Your cart is empty.</li>';
            placeOrderButton.disabled = true;
        } else {
            let total = 0;
            cart.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name} (x${item.quantity}) - ${currency}${(item.price * item.quantity).toFixed(2)}`;
                cartItemsContainer.appendChild(li);
                total += item.price * item.quantity;
            });
            if (cartTotalCurrencyElement) cartTotalCurrencyElement.textContent = currency;
            cartTotalElement.textContent = total.toFixed(2);
            placeOrderButton.disabled = cart.length === 0; // Only disable if cart is truly empty
        }
    }

    /**
     * Checks if the customer has a usable address on file.
     * @returns {boolean} True if a basic address is present.
     */
    function hasAddress() {
        return customerDetails && customerDetails.address_line1 && customerDetails.city;
    }

    /**
     * Shows/hides delivery options based on the service types in the cart.
     */
    function toggleDeliveryOptions() {
        if (cart.length === 0) return;

        const serviceTypes = new Set(cart.map(item => item.service_type));


        // If 'hotel' service is in the cart, hide all options.
        if (serviceTypes.has('hotel')) {
            pickupOptionsContainer.style.display = 'none';
            returnOptionsContainer.style.display = 'none';
            return;
        }

        // If 'food' service is in the cart, only show return/delivery options.
        if (serviceTypes.has('food')) {
            pickupOptionsContainer.style.display = 'none';
            returnOptionsContainer.style.display = 'block';
            return;
        }

        // For other services like laundry, show both pickup and return options.
        pickupOptionsContainer.style.display = 'block';
        returnOptionsContainer.style.display = 'block';

        // Now, disable options if the address is missing.
        const addressIsSet = hasAddress();
        const servicePickupRadio = document.querySelector('input[name="pickup_method"][value="service_pickup"]');
        const customerDropoffRadio = document.querySelector('input[name="pickup_method"][value="customer_dropoff"]');
        const serviceDeliveryRadio = document.querySelector('input[name="return_method"][value="service_delivery"]');
        const customerPickupRadio = document.querySelector('input[name="return_method"][value="customer_pickup"]');

        if (!addressIsSet) {
            const noAddressMessage = 'Please add an address in your settings to enable this option.';
            if (servicePickupRadio) {
                servicePickupRadio.disabled = true;
                servicePickupRadio.parentElement.title = noAddressMessage;
                // If the disabled option was checked, switch to the available one.
                if (servicePickupRadio.checked) customerDropoffRadio.checked = true;
            }
            if (serviceDeliveryRadio) {
                serviceDeliveryRadio.disabled = true;
                serviceDeliveryRadio.parentElement.title = noAddressMessage;
                // If the disabled option was checked, switch to the available one.
                if (serviceDeliveryRadio.checked) customerPickupRadio.checked = true;
            }
            // Add a helpful message for the user
            placeOrderButton.insertAdjacentHTML('afterend', '<p class="help is-info mt-2">Some delivery options are disabled because you have not set an address in your <a href="/settings">account settings</a>.</p>');
        }
    }

    /**
     * Submits the cart to the backend to create a booking.
     */
    async function placeOrder() {
        placeOrderButton.classList.add('is-loading');
        orderStatus.classList.add('is-hidden');

        // Get selected delivery/pickup methods
        const pickupMethod = document.querySelector('input[name="pickup_method"]:checked')?.value;
        const returnMethod = document.querySelector('input[name="return_method"]:checked')?.value;

        const orderData = {
            items: cart.map(item => ({ service_id: item.service_id, quantity: item.quantity })),
            pickup_method: pickupMethod,
            return_method: returnMethod
        };

        try {
            const response = await fetch('/api/customer/create-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');

            orderStatus.className = 'notification is-success';
            orderStatus.textContent = `Success! Your order #${result.bookingId} has been placed. Redirecting to your bookings...`;
            cart = []; // Clear the cart
            renderCart();

            // Redirect to the bookings page after a short delay
            setTimeout(() => { window.location.href = '/my-bookings'; }, 2000);
        } catch (error) {
            orderStatus.className = 'notification is-danger';
            orderStatus.textContent = `Error: ${error.message}`;
        } finally {
            placeOrderButton.classList.remove('is-loading');
        }
    }

    // --- Event Listeners ---
    servicesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-button')) {
            event.preventDefault();
            const serviceId = parseInt(event.target.dataset.serviceId, 10);
            const name = event.target.dataset.name;
            const price = parseFloat(event.target.dataset.price);
            const serviceType = event.target.dataset.serviceType; // Assuming this is added to the button
            addToCart(serviceId, name, price, serviceType);
        }
    });

    placeOrderButton.addEventListener('click', placeOrder);

    // --- Initial Load ---
    loadServices();
    renderCart();
});

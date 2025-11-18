
document.addEventListener('DOMContentLoaded', () => { // This is now checkout.js
    const servicesContainer = document.getElementById('services-list-container');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const placeOrderButton = document.getElementById('place-order-button');
    const orderStatus = document.getElementById('order-status');

    let cart = []; // This will store our cart items: { service_id, name, price, quantity }

    /**
     * Fetches available services and renders them on the page.
     */
    async function loadServices() {
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
                            <p class="has-text-weight-bold">Price: $${service.base_price.toFixed(2)}</p>
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
    function addToCart(serviceId, name, price) {
        const idAsNumber = parseInt(serviceId, 10);
        const existingItem = cart.find(item => item.service_id === idAsNumber);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ service_id: idAsNumber, name, price, quantity: 1 });
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
                li.textContent = `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`;
                cartItemsContainer.appendChild(li);
                total += item.price * item.quantity;
            });
            cartTotalElement.textContent = total.toFixed(2);
            placeOrderButton.disabled = false;
        }
    }

    /**
     * Submits the cart to the backend to create a booking.
     */
    async function placeOrder() {
        placeOrderButton.classList.add('is-loading');
        orderStatus.classList.add('is-hidden');

        const orderData = {
            items: cart.map(item => ({ service_id: item.service_id, quantity: item.quantity }))
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
            orderStatus.textContent = `Success! Your order #${result.bookingId} has been placed.`;
            cart = []; // Clear the cart
            renderCart();
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
            addToCart(serviceId, name, price);
        }
    });

    placeOrderButton.addEventListener('click', placeOrder);

    // --- Initial Load ---
    loadServices();
    renderCart();
});

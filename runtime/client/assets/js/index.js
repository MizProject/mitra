document.addEventListener('DOMContentLoaded', () => {
    let currency = '$';

        /**
         * Fetches available services and populates the service list.
         */
        async function fetchServices() {
            const servicesList = document.getElementById('services-list');
            // Fetch currency first
            try {
                const response = await fetch('/api/get-site-config');
                const config = await response.json();
                if (config.currency_symbol) currency = config.currency_symbol;
            } catch (e) { /* Use default currency */ }

            try {
                const response = await fetch('/api/get-services');
                if (!response.ok) throw new Error('Failed to load services.');
                const services = await response.json();

                servicesList.innerHTML = ''; // Clear the loading progress bar

                if (services.length === 0) {
                    servicesList.innerHTML = '<div class="column has-text-centered"><p>Offer not found in database, please check again later.</p></div>';
                    return;
                }

                services.forEach(service => {
                    const column = document.createElement('div');
                    column.className = 'column is-one-third';

                    // Use service image or a placeholder
                    const imageUrl = service.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image';

                    column.innerHTML = `
                        <div class="card service-card">
                            <div class="card-image">
                                <figure class="image is-4by3">
                                    <img src="${imageUrl}" alt="${service.service_name || 'Service Image'}">
                                </figure>
                            </div>
                            <div class="card-content">
                                <p class="title is-4">${service.service_name || 'Unnamed Service'}</p>
                                <p class="subtitle is-6">${service.description || 'No description available.'}</p>
                                <p class="is-size-5 has-text-weight-bold has-text-primary" style="color: var(--primary-color) !important;">${currency}${Number(service.base_price).toFixed(2)}</p>
                            </div>
                            <footer class="card-footer"><a href="#" class="card-footer-item has-text-weight-bold" style="color: var(--primary-color);">Book Now</a></footer>
                        </div>
                    `;
                    servicesList.appendChild(column);
                });

            } catch (error) {
                console.error('Error fetching services:', error);
                servicesList.innerHTML = '<div class="column has-text-centered"><p class="has-text-danger">Could not load services at this time.</p></div>';
            }
        }

        /**
         * Sets up the mobile navigation burger menu.
         */
        function setupNavbarBurger() {
            const burger = document.querySelector('.navbar-burger');
            const menu = document.querySelector('.navbar-menu');
            if (burger && menu) {
                burger.addEventListener('click', () => {
                    burger.classList.toggle('is-active');
                    menu.classList.toggle('is-active');
                });
            }
        }

        // Initialize the page
        fetchServices();
        setupNavbarBurger();
    });
document.addEventListener('DOMContentLoaded', () => {
    let currency = '$';

        /**
         * Fetches available services and populates the service list.
         */
        async function fetchServices() {
            const servicesList = document.getElementById('services-list');
            if (!servicesList) return;

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
                            <footer class="card-footer">
                                <a href="#" class="card-footer-item has-text-weight-bold" style="color: var(--primary-color);">Book Now</a>
                                <a href="#" class="card-footer-item view-reviews-btn" data-id="${service.service_id}" data-name="${service.service_name}">Reviews</a>
                            </footer>
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
         * Injects the Reviews link into the navbar.
         */
        function setupNavbarLinks() {
            const navbarMenu = document.querySelector('.navbar-menu');
            if (!navbarMenu) return;

            let navbarStart = navbarMenu.querySelector('.navbar-start');
            if (!navbarStart) {
                navbarStart = document.createElement('div');
                navbarStart.className = 'navbar-start';
                navbarMenu.insertBefore(navbarStart, navbarMenu.firstChild);
            }

            // Avoid duplicates
            if (navbarStart.querySelector('a[href="/reviews"]')) return;

            const reviewsLink = document.createElement('a');
            reviewsLink.className = 'navbar-item';
            reviewsLink.href = '/reviews';
            reviewsLink.textContent = 'Reviews';
            
            // Append to the start of the menu
            navbarStart.appendChild(reviewsLink);
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

        /**
         * Sets up the reviews modal and event listeners.
         */
        function setupReviewsModal() {
            const servicesList = document.getElementById('services-list');
            if (!servicesList) return;

            // Create Modal HTML
            const modalHtml = `
                <div class="modal" id="reviews-modal">
                    <div class="modal-background"></div>
                    <div class="modal-card">
                        <header class="modal-card-head">
                            <p class="modal-card-title">Reviews</p>
                            <button class="delete" aria-label="close"></button>
                        </header>
                        <section class="modal-card-body">
                            <div class="field is-horizontal mb-4">
                                <div class="field-label is-normal" style="flex-grow: 0; margin-right: 1rem;">
                                    <label class="label">Sort by</label>
                                </div>
                                <div class="field-body">
                                    <div class="field">
                                        <div class="control">
                                            <div class="select is-fullwidth">
                                                <select id="review-sort-select">
                                                    <option value="newest">Newest First</option>
                                                    <option value="oldest">Oldest First</option>
                                                    <option value="highest">Highest Rating</option>
                                                    <option value="lowest">Lowest Rating</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="reviews-list" class="mb-5">Loading...</div>
                            <hr>
                            <h4 class="title is-5">Write an Anonymous Review</h4>
                            <form id="review-form">
                                <input type="hidden" id="review-service-id">
                                <div class="field">
                                    <label class="label">Rating</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="review-rating">
                                                <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                                                <option value="4">⭐⭐⭐⭐ (4)</option>
                                                <option value="3">⭐⭐⭐ (3)</option>
                                                <option value="2">⭐⭐ (2)</option>
                                                <option value="1">⭐ (1)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="field">
                                    <label class="label">Comment</label>
                                    <div class="control">
                                        <textarea class="textarea" id="review-comment" placeholder="Share your experience..."></textarea>
                                    </div>
                                </div>
                                <button type="submit" class="button is-primary">Submit Review</button>
                                <div id="review-status" class="notification is-hidden mt-3"></div>
                            </form>
                        </section>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById('reviews-modal');
            const servicesList = document.getElementById('services-list');
            const reviewForm = document.getElementById('review-form');
            const reviewsListContainer = document.getElementById('reviews-list');
            const sortSelect = document.getElementById('review-sort-select');
            let currentReviews = [];

            // Close Modal Logic
            const closeModal = () => {
                modal.classList.remove('is-active');
                document.getElementById('review-status').classList.add('is-hidden');
                reviewForm.reset();
                sortSelect.value = 'newest';
            };
            modal.querySelector('.delete').addEventListener('click', closeModal);
            modal.querySelector('.modal-background').addEventListener('click', closeModal);

            // Render Reviews Function
            function renderReviews() {
                const sortValue = sortSelect.value;
                let sorted = [...currentReviews];

                if (sortValue === 'newest') {
                    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                } else if (sortValue === 'oldest') {
                    sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                } else if (sortValue === 'highest') {
                    sorted.sort((a, b) => b.rating - a.rating);
                } else if (sortValue === 'lowest') {
                    sorted.sort((a, b) => a.rating - b.rating);
                }

                if (sorted.length === 0) {
                    reviewsListContainer.innerHTML = '<p>No reviews yet. Be the first!</p>';
                } else {
                    reviewsListContainer.innerHTML = sorted.map(r => `
                        <div class="box">
                            <article class="media">
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            <strong>${r.reviewer_name || 'Anonymous'}</strong> <small>${new Date(r.created_at).toLocaleDateString()}</small>
                                            <br>
                                            ${'⭐'.repeat(r.rating)}
                                            <br>
                                            ${r.comment || ''}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>
                    `).join('');
                }
            }

            sortSelect.addEventListener('change', renderReviews);

            // Open Modal Logic (Event Delegation)
            servicesList.addEventListener('click', async (e) => {
                const btn = e.target.closest('.view-reviews-btn');
                if (btn) {
                    e.preventDefault();
                    const serviceId = btn.dataset.id;
                    const serviceName = btn.dataset.name;
                    
                    document.getElementById('review-service-id').value = serviceId;
                    modal.querySelector('.modal-card-title').textContent = `Reviews for ${serviceName}`;
                    modal.classList.add('is-active');
                    
                    // Fetch Reviews
                    reviewsListContainer.innerHTML = '<progress class="progress is-small is-primary" max="100"></progress>';
                    try {
                        const res = await fetch(`/api/reviews/${serviceId}`);
                        currentReviews = await res.json();
                        renderReviews();
                    } catch (err) {
                        reviewsListContainer.innerHTML = '<p class="has-text-danger">Failed to load reviews.</p>';
                    }
                }
            });

            // Submit Review Logic
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const serviceId = document.getElementById('review-service-id').value;
                const rating = document.getElementById('review-rating').value;
                const comment = document.getElementById('review-comment').value;
                const statusBox = document.getElementById('review-status');
                const submitBtn = reviewForm.querySelector('button[type="submit"]');

                submitBtn.classList.add('is-loading');
                statusBox.classList.add('is-hidden');

                try {
                    const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ serviceId, rating, comment })
                    });
                    const result = await res.json();
                    
                    if (res.ok) {
                        statusBox.className = 'notification is-success mt-3';
                        statusBox.textContent = 'Review submitted!';
                        reviewForm.reset();
                        setTimeout(closeModal, 1500);
                    } else {
                        throw new Error(result.error);
                    }
                } catch (err) {
                    statusBox.className = 'notification is-danger mt-3';
                    statusBox.textContent = err.message;
                } finally {
                    submitBtn.classList.remove('is-loading');
                    statusBox.classList.remove('is-hidden');
                }
            });
        }

        // Initialize the page
        fetchServices();
        setupNavbarBurger();
        setupNavbarLinks();
        setupReviewsModal();
    });
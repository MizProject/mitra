document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tabs li');
    const tabContents = document.querySelectorAll('.content-tab');
    let siteConfig = {}; // To store site config like logo and name

    const bookingContainers = {
        'Pending': document.getElementById('pending-tab'),
        'Processing': document.getElementById('processing-tab'),
        'Completed': document.getElementById('completed-tab'),
        'Canceled': document.getElementById('canceled-tab'),
    };

    // --- Socket.IO Connection ---
    // Dynamically load the Socket.IO client script from the server
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => {
        const socket = io();
        socket.on('booking_update', () => loadBookings());
    };
    document.head.appendChild(script);

    /**
     * Handles tab switching UI.
     */
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('is-active'));
            tab.classList.add('is-active');

            const target = document.getElementById(tab.dataset.tab);
            tabContents.forEach(content => content.classList.remove('is-active'));
            target.classList.add('is-active');
        });
    });

    /**
     * Fetches bookings and populates the tabs.
     */
    async function loadBookings() {
        await loadSiteConfig(); // Fetch site config first
        try {
            const response = await fetch('/api/customer/bookings');
            if (!response.ok) throw new Error('Failed to load bookings.');
            const bookings = await response.json();

            // Cache the bookings in session storage for the receipt generator to use
            sessionStorage.setItem('my-bookings-cache', JSON.stringify(bookings));

            // Clear all containers first
            Object.values(bookingContainers).forEach(container => container.innerHTML = '');

            if (bookings.length === 0) {
                bookingContainers['Pending'].innerHTML = '<p>You have no bookings yet.</p>';
                return;
            }

            bookings.forEach(booking => {
                const container = bookingContainers[booking.status];
                if (container) {
                    const bookingCard = createBookingCard(booking);
                    container.appendChild(bookingCard);
                }
            });

            // Add a message to empty tabs
            Object.values(bookingContainers).forEach(container => {
                if (container.innerHTML === '') {
                    container.innerHTML = '<p>You have no bookings in this category.</p>';
                }
            });

        } catch (error) {
            console.error('Error loading bookings:', error);
            bookingContainers['Pending'].innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    }

    // Set up a single, delegated event listener for the entire container
    document.querySelector('.section .container').addEventListener('click', (event) => {
        handleCardButtonClick(event);
    });

    /**
     * Fetches and stores the site configuration.
     */
    async function loadSiteConfig() {
        try {
            const response = await fetch('/api/get-site-config');
            if (response.ok) siteConfig = await response.json();
        } catch (error) {
            console.error('Could not load site configuration for QR codes.', error);
        }
    }

    /**
     * Creates an HTML element for a single booking.
     * @param {object} booking - The booking data object.
     * @returns {HTMLElement} A div element representing the booking card.
     */
    function createBookingCard(booking) {
        const card = document.createElement('div');
        card.className = 'box booking-card';

        const bookingDate = new Date(booking.booking_date).toLocaleDateString();
        let itemsHtml = '<ul>';
        try {
            let isLaundryOrder = false;
            // The 'items' property is a JSON string from the server
            const items = JSON.parse(booking.items);
            if (items) {
                items.forEach(item => {
                    itemsHtml += `<li>${item.quantity}x ${item.service_name} - ${siteConfig.currency_symbol || '$'}${(item.price * item.quantity).toFixed(2)}</li>`;
                    if (item.service_type === 'laundry') {
                        isLaundryOrder = true;
                    }
                });
            }

            if (isLaundryOrder) {
                itemsHtml += `</ul><div class="notification is-info is-light mt-3"><p class="is-size-7"><strong>Laundry Instructions:</strong> Please ensure to present the QR Code at the laundry shop.</p></div><ul>`;
            }
        } catch (e) {
            itemsHtml += '<li>Error parsing booking items.</li>';
        }
        itemsHtml += '</ul>';

        card.innerHTML = `
            <div class="content">
                <p class="is-size-5 has-text-weight-bold">Booking #${booking.booking_id}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Total:</strong> ${siteConfig.currency_symbol || '$'}${booking.total_price.toFixed(2)}</p>
                <p><strong>Scheduled:</strong> ${booking.schedule_date || 'Not Specified'} ${booking.schedule_time ? 'at ' + booking.schedule_time : ''}</p>
                <p><strong>Pickup:</strong> ${formatMethod(booking.pickup_method)}</p>
                <p><strong>Return:</strong> ${formatMethod(booking.return_method)}</p>
                <p><strong>Items:</strong></p>
                ${itemsHtml}
            </div>
            <div class="card-footer">
                <a class="card-footer-item show-qr-code" data-booking-id="${booking.booking_id}">
                    <span class="icon-text"><span class="icon"><i class="fas fa-qrcode"></i></span><span>Show QR Code and Recipt</span></span>
                </a>
                ${booking.status === 'Completed' ? `<a class="card-footer-item has-text-primary rate-booking" data-booking-id="${booking.booking_id}">
                    <span class="icon-text"><span class="icon"><i class="fas fa-star"></i></span><span>Rate Services</span></span>
                </a>` : ''}
                ${booking.status === 'Pending' ? `<a class="card-footer-item has-text-danger cancel-booking" data-booking-id="${booking.booking_id}">Cancel Booking</a>` : ''}
            </div>
        `;
        return card;
    }

    /**
     * Converts method codes into human-readable strings.
     * @param {string} method - The method code (e.g., 'service_pickup').
     * @returns {string} A user-friendly string.
     */
    function formatMethod(method) {
        if (!method) return 'Not Specified';
        const map = {
            'service_pickup': 'Service Will Pick Up',
            'customer_dropoff': 'Customer Will Drop Off',
            'service_delivery': 'Service Will Deliver',
            'customer_pickup': 'Customer Will Pick Up'
        };
        return map[method] || method;
    }

    /**
     * Handles clicks on buttons within a booking card (e.g., Cancel, Show QR).
     * @param {Event} event - The click event.
     */
    async function handleCardButtonClick(event) {
        const target = event.target.closest('a');
        if (!target) return;

        const bookingId = target.dataset.bookingId; // This is a string
        if (!bookingId) return;

        // --- Cancel Booking Logic ---
        if (target.classList.contains('cancel-booking')) {
            if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

            try {
                const response = await fetch(`/api/customer/bookings/${bookingId}/cancel`, { method: 'POST' });
                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Failed to cancel booking.');
                }
                // Reload bookings to reflect the change
                loadBookings();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }

        // --- Rate Booking Logic ---
        if (target.classList.contains('rate-booking')) {
            const bookings = JSON.parse(sessionStorage.getItem('my-bookings-cache') || '[]');
            const bookingData = bookings.find(b => b.booking_id.toString() === bookingId);
            if (bookingData) openRatingModal(bookingData);
        }

        // --- Show QR Code Logic ---
        if (target.classList.contains('show-qr-code')) {
            // Create a modal structure
            const modal = document.createElement('div');
            modal.className = 'modal is-active';
            modal.innerHTML = `
                <div class="modal-background"></div>
                <div class="modal-card" style="width: 360px;">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Order Receipt</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body has-text-centered">
                        <p class="mb-4">Present this at the shop for your order.</p>
                        <canvas id="receipt-canvas" style="display: block; margin: 0 auto;"></canvas>
                    </section>
                    <footer class="modal-card-foot is-justify-content-center">
                        <button class="button is-primary" id="download-qr-button">
                            <span class="icon"><i class="fas fa-download"></i></span>
                            <span>Save Recipt with QR Code</span>
                        </button>
                        <button class="button" id="close-qr-modal">Close</button>
                    </section>
                </div>
            `;
            document.body.appendChild(modal);

            // Find the full booking details to pass to the receipt generator
            const bookings = JSON.parse(sessionStorage.getItem('my-bookings-cache') || '[]');
            const bookingData = bookings.find(b => b.booking_id.toString() === bookingId);

            // Generate the full receipt on the canvas
            if (bookingData) generateReceiptCanvas(bookingData, 'receipt-canvas');

            // Add event listeners to close the modal
            const closeElements = modal.querySelectorAll('.delete, .modal-background, #close-qr-modal');
            closeElements.forEach(el => {
                el.addEventListener('click', () => modal.remove());
            });

            // Add download functionality
            document.getElementById('download-qr-button').addEventListener('click', () => {
                const canvas = document.getElementById('receipt-canvas');
                const link = document.createElement('a');
                link.download = `booking-qr-${bookingId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    }

    /**
     * Opens the rating modal and populates it with items to rate.
     * @param {object} booking - The booking object.
     */
    function openRatingModal(booking) {
        const modal = document.getElementById('rating-modal');
        const container = document.getElementById('rating-items-container');
        const closeBtns = modal.querySelectorAll('.delete, .modal-background, #close-rating-modal');

        // Parse items
        let items = [];
        try { items = JSON.parse(booking.items); } catch(e) {}

        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p>No items found to rate.</p>';
        } else {
            items.forEach((item, index) => {
                // We need the service_id. The current JSON structure in my-bookings query might not have it directly 
                // if it wasn't selected in the SQL. 
                // However, looking at runtime.js: 'service_name' is selected. 
                // We need to ensure service_id is available. 
                // *Self-correction*: The current SQL for customer bookings aggregates JSON with service_type, service_name, quantity, price.
                // It does NOT include service_id. We need to rely on service_name or update backend.
                // For now, let's assume we can't easily get service_id without backend change.
                // BUT, the user asked to modify client side. 
                // Let's check runtime.js again.
                // The SQL in /api/customer/bookings does NOT select service_id.
                // I will assume for this task I can't change backend SQL easily without breaking context rules (though I can if needed).
                // Wait, I can modify runtime.js if needed. But let's see if we can match by name or if I should just update the SQL.
                // Updating SQL is safer.
                
                // Since I cannot update runtime.js in this specific step (I already did in previous turns, but let's stick to the requested files).
                // Actually, I can't submit a review without service_id.
                // I will try to find the service_id from the public services list if possible, or just fail gracefully.
                // Better approach: The user asked to modify my-bookings files. I will try to fetch all services to map names to IDs.
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'box';
                itemDiv.innerHTML = `
                    <p class="title is-6">${item.service_name}</p>
                    <div class="field">
                        <div class="control star-rating" id="star-rating-${index}">
                            <i class="fas fa-star" data-value="1"></i>
                            <i class="fas fa-star" data-value="2"></i>
                            <i class="fas fa-star" data-value="3"></i>
                            <i class="fas fa-star" data-value="4"></i>
                            <i class="fas fa-star" data-value="5"></i>
                        </div>
                    </div>
                    <div class="field">
                        <div class="control">
                            <textarea class="textarea is-small" placeholder="Write a review..." id="review-comment-${index}"></textarea>
                        </div>
                    </div>
                    <button class="button is-small is-primary submit-review-btn" data-index="${index}" data-service-name="${item.service_name}">Submit Review</button>
                `;
                container.appendChild(itemDiv);
            });
        }

        // Event delegation for stars and submit
        container.onclick = async (e) => {
            if (e.target.matches('.fa-star')) {
                const value = e.target.dataset.value;
                const parent = e.target.closest('.star-rating');
                const stars = parent.querySelectorAll('.fa-star');
                stars.forEach(s => {
                    if (s.dataset.value <= value) s.classList.add('checked');
                    else s.classList.remove('checked');
                });
                parent.dataset.selectedValue = value;
            }

            if (e.target.classList.contains('submit-review-btn')) {
                const btn = e.target;
                const index = btn.dataset.index;
                const serviceName = btn.dataset.serviceName;
                const ratingContainer = document.getElementById(`star-rating-${index}`);
                const rating = ratingContainer.dataset.selectedValue;
                const comment = document.getElementById(`review-comment-${index}`).value;

                if (!rating) {
                    alert('Please select a star rating.');
                    return;
                }

                btn.classList.add('is-loading');

                // Resolve Service ID
                try {
                    // Fetch all services to find the ID (inefficient but works without backend changes)
                    const servicesRes = await fetch('/api/get-services');
                    const services = await servicesRes.json();
                    const service = services.find(s => s.service_name === serviceName);
                    
                    if (!service) throw new Error('Service ID not found.');

                    const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ serviceId: service.service_id, rating, comment })
                    });

                    if (res.ok) {
                        btn.classList.remove('is-primary', 'is-loading');
                        btn.classList.add('is-success');
                        btn.textContent = 'Submitted';
                        btn.disabled = true;
                    } else {
                        throw new Error('Failed to submit.');
                    }
                } catch (err) {
                    alert(err.message);
                    btn.classList.remove('is-loading');
                }
            }
        };

        modal.classList.add('is-active');

        const closeModal = () => modal.classList.remove('is-active');
        closeBtns.forEach(btn => btn.onclick = closeModal);
    }


    // --- Rating Logic ---
    const ratingContainer = document.getElementById('rating-items-container');
    if (ratingContainer) {
        ratingContainer.addEventListener('click', async (e) => {
            // Handle Rating Button Click
            const ratingBtn = e.target.closest('.rating-btn');
            if (ratingBtn) {
                const value = parseInt(ratingBtn.dataset.value, 10);
                const parent = ratingBtn.closest('.rating-buttons');
                const buttons = parent.querySelectorAll('.rating-btn');
                
                buttons.forEach(b => {
                    const bValue = parseInt(b.dataset.value, 10);
                    const icon = b.querySelector('i');
                    if (bValue <= value) {
                        b.classList.add('is-warning');
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    } else {
                        b.classList.remove('is-warning');
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                    }
                });
                parent.dataset.selectedValue = value;
            }

            // Handle Submit Click
            if (e.target.classList.contains('submit-review-btn')) {
                const btn = e.target;
                const index = btn.dataset.index;
                const serviceId = btn.dataset.serviceId;
                const bookingId = btn.dataset.bookingId;
                const ratingBox = document.getElementById(`star-rating-${index}`);
                const rating = ratingBox.dataset.selectedValue;
                const comment = document.getElementById(`review-comment-${index}`).value;
                const isAnonymous = document.getElementById(`review-anonymous-${index}`).checked;

                if (!rating) {
                    alert('Please select a star rating.');
                    return;
                }

                btn.classList.add('is-loading');

                try {
                    const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ serviceId: serviceId, rating, comment, isAnonymous, bookingId: parseInt(bookingId, 10) })
                    });

                    if (res.ok) {
                        btn.classList.remove('is-primary', 'is-loading');
                        btn.classList.add('is-success');
                        btn.textContent = 'Submitted';
                        btn.disabled = true;
                    } else {
                        throw new Error('Failed to submit.');
                    }
                } catch (err) {
                    alert(err.message);
                    btn.classList.remove('is-loading');
                }
            }
        });
    }

    /**
     * Opens the rating modal and populates it with items to rate.
     * @param {object} booking - The booking object.
     */
    async function openRatingModal(booking) {
        const modal = document.getElementById('rating-modal');
        const container = document.getElementById('rating-items-container');
        const closeBtns = modal.querySelectorAll('.delete, .modal-background, #close-rating-modal');

        // Helper to generate static stars for read-only view
        const getStaticStars = (rating) => {
            let html = '<span class="has-text-warning">';
            for (let i = 1; i <= 5; i++) {
                html += `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`;
            }
            return html + '</span>';
        };

        container.innerHTML = '<progress class="progress is-small is-primary" max="100"></progress>';
        modal.classList.add('is-active');

        // Parse items
        let items = [];
        try { items = JSON.parse(booking.items); } catch(e) {}

        // Fetch existing reviews for this user
        let userReviews = [];
        try {
            const res = await fetch(`/api/customer/reviews?t=${Date.now()}`);
            if (res.ok) userReviews = await res.json();
        } catch (e) { console.error("Failed to fetch user reviews", e); }

        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<p>No items found to rate.</p>';
        } else {
            items.forEach((item, index) => {
                // Find existing review for this service AND this booking
                const review = userReviews.find(r => r.service_id === item.service_id && r.booking_id == booking.booking_id);
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'box';

                if (review && review.edit_count >= 1) {
                    // Read-only view
                    itemDiv.innerHTML = `
                        <p class="title is-6">${item.service_name}</p>
                        <div class="mb-2 is-size-5">
                            ${getStaticStars(review.rating)}
                        </div>
                        <div class="content">
                            <p><strong>Your Review:</strong></p>
                            <p class="is-italic">"${review.comment || 'No comment provided.'}"</p>
                        </div>
                        <p class="is-size-7 has-text-grey mb-2">
                            ${review.is_anonymous ? 'Posted anonymously' : 'Posted publicly'} • ${new Date(review.created_at).toLocaleDateString()}
                        </p>
                        <div class="notification is-light is-info p-2 is-size-7">
                            <span class="icon"><i class="fas fa-lock"></i></span>
                            <span>This review has been finalized and can no longer be edited.</span>
                        </div>
                    `;
                } else {
                    // Editable view (New or Edit)
                    const rating = review ? review.rating : 0;
                    const comment = review ? review.comment : '';
                    const isAnon = review ? review.is_anonymous : false;
                    const btnText = review ? 'Update Review' : 'Submit Review';

                    // Generate star buttons with pre-filled state
                    let starsHtml = '';
                    for(let i=1; i<=5; i++) {
                        const isChecked = i <= rating ? 'is-warning' : '';
                        const iconClass = i <= rating ? 'fas' : 'far';
                        starsHtml += `<button class="button rating-btn ${isChecked}" data-value="${i}" type="button"><span class="icon"><i class="${iconClass} fa-star"></i></span></button>`;
                    }

                    itemDiv.innerHTML = `
                    <p class="title is-6">${item.service_name}</p>
                    <div class="field">
                        <label class="label is-small">Rating</label>
                        <div class="buttons has-addons rating-buttons mb-2" id="star-rating-${index}" data-selected-value="${rating}">
                            ${starsHtml}
                        </div>
                    </div>
                    <div class="field">
                        <label class="label is-small">Comment</label>
                        <div class="control">
                            <textarea class="textarea is-small" placeholder="Write a review..." id="review-comment-${index}">${comment}</textarea>
                        </div>
                    </div>
                    <div class="field">
                        <div class="control">
                            <label class="checkbox">
                                <input type="checkbox" id="review-anonymous-${index}" ${isAnon ? 'checked' : ''}>
                                Post Anonymously
                            </label>
                        </div>
                    </div>
                    <button class="button is-small is-primary submit-review-btn" data-index="${index}" data-service-id="${item.service_id}" data-booking-id="${booking.booking_id}">${btnText}</button>
                    <p class="help is-info">${review ? 'You have one edit remaining.' : 'You can edit your review only once.'}</p>
                    `;
                }
                
                container.appendChild(itemDiv);
            });
        }

        const closeModal = () => modal.classList.remove('is-active');
        closeBtns.forEach(btn => btn.onclick = closeModal);
    }

    /**
     * Wraps text to fit within a max width on a canvas.
     * @param {CanvasRenderingContext2D} context - The canvas rendering context.
     * @param {string} text - The text to wrap.
     * @param {number} maxWidth - The maximum width the text can occupy.
     * @returns {string[]} An array of strings, where each string is a line of wrapped text.
     */
    function wrapText(context, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
    /**
     * Generates a full receipt-style image on a canvas.
     * @param {object} booking - The full booking object.
     * @param {string} canvasId - The ID of the canvas element to draw on.
     */
    async function generateReceiptCanvas(booking, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // --- 1. Calculate dynamic canvas height ---
        const width = 320;
        let currentY = 0;
        const padding = 20;
        const lineSpacing = 22;
        const sectionSpacing = 15;
        const items = JSON.parse(booking.items || '[]');
        // Calculate dynamic height: Base for header + space for items + space for QR/footer
        let height = 275 + (items.length * lineSpacing) + 250;

        // Recalculate height based on wrapped text
        items.forEach(item => {
            const text = `${item.quantity}x ${item.service_name}`;
            const lines = wrapText(ctx, text, width - (padding * 2) - 80); // 80 is for price column
            if (lines.length > 1) {
                height += (lines.length - 1) * lineSpacing;
            }
        });

        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';

        // --- 2. Draw Header (Logo or Company Name) ---
        currentY += padding + 30;
        if (siteConfig.page_logo) {
            try {
                const logoImg = new Image();
                logoImg.crossOrigin = "Anonymous";
                await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = reject;
                    logoImg.src = siteConfig.page_logo;
                });
                ctx.drawImage(logoImg, (width - 100) / 2, currentY - 30, 100, 35);
                currentY += 15;
            } catch (e) { /* Fallback to text below */ }
        }
        if (!siteConfig.page_logo && siteConfig.page_name) {
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(siteConfig.page_name, width / 2, currentY);
            currentY += lineSpacing;
        }
        ctx.font = '16px sans-serif';
        ctx.fillText('Order Form', width / 2, currentY);
        currentY += sectionSpacing;

        // --- 2a. Draw Customer Name ---
        if (booking.first_name || booking.last_name) {
            ctx.font = '14px sans-serif';
            ctx.fillText(`For: ${booking.first_name || ''} ${booking.last_name || ''}`.trim(), width / 2, currentY);
            currentY += lineSpacing;
        }

        if (booking.schedule_date) {
            ctx.font = '14px sans-serif';
            ctx.fillText(`Scheduled: ${booking.schedule_date} ${booking.schedule_time ? '@ ' + booking.schedule_time : ''}`, width / 2, currentY);
            currentY += lineSpacing;
        }
    
    // --- Draw Delivery/Pickup Methods ---
    if (booking.pickup_method || booking.return_method) {
        ctx.font = '12px sans-serif';
        if (booking.pickup_method) ctx.fillText(`Pickup: ${formatMethod(booking.pickup_method)}`, width / 2, currentY);
        currentY += lineSpacing; // Ensure consistent line spacing
        if (booking.return_method) ctx.fillText(`Return: ${formatMethod(booking.return_method)}`, width / 2, currentY);
        currentY += lineSpacing;
    }

        // --- 3. Draw Items ---
        const drawLine = () => {
            currentY += sectionSpacing / 2;
            ctx.fillRect(padding, currentY, width - (padding * 2), 1);
            currentY += sectionSpacing;
        };
        drawLine();
        ctx.textAlign = 'left';
        ctx.font = '14px monospace';
        if (items.length > 0) {
            const priceColumnWidth = 80;
            const maxTextWidth = width - (padding * 2) - priceColumnWidth;

            items.forEach(item => {
                const itemText = `${item.quantity}x ${item.service_name}`;
                const priceText = `${siteConfig.currency_symbol || '$'}${(item.price * item.quantity).toFixed(2)}`;
                const lines = wrapText(ctx, itemText, maxTextWidth);

                lines.forEach((line, index) => {
                    ctx.fillText(line, padding, currentY);
                    if (index < lines.length - 1) {
                        currentY += lineSpacing;
                    }
                });
                ctx.textAlign = 'right';
                ctx.fillText(priceText, width - padding, currentY);
                ctx.textAlign = 'left';
                currentY += lineSpacing;
            });
        }
        drawLine();

        // --- 4. Draw Total ---
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Total: ${siteConfig.currency_symbol || '$'}${booking.total_price.toFixed(2)}`, width - padding, currentY);
        currentY += sectionSpacing * 2;

        // --- 5. Draw QR Code ---
        const qrSize = 128;
        const qr = qrcode(4, 'M');
        qr.addData(String(booking.booking_id));
        qr.make();

        // Manually draw the QR code to ensure it's a perfect square
        const qrModuleSize = qrSize / qr.getModuleCount();
        const qrX = (width - qrSize) / 2;
        for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
                ctx.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
                ctx.fillRect(qrX + col * qrModuleSize, currentY + row * qrModuleSize, qrModuleSize, qrModuleSize);
            }
        }

        // --- 6. Draw Booking ID and Footer ---
        ctx.textAlign = 'center';
        // This line was duplicated, removing one.
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#000';
        ctx.fillText(booking.booking_id, width / 2, currentY + qrSize + sectionSpacing);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Not an official receipt. For reference only.', width / 2, height - padding);
        ctx.fillText('Powered by Mitra Systems | MizProject', width / 2, height - padding + 12);
        
    }

    loadBookings();
});

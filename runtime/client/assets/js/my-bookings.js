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
                    itemsHtml += `<li>${item.quantity}x ${item.service_name} - $${(item.price * item.quantity).toFixed(2)}</li>`;
                    if (item.service_type === 'laundry') {
                        isLaundryOrder = true;
                    }
                });
            }

            if (isLaundryOrder) {
                itemsHtml += `</ul><div class="notification is-info is-light mt-3"><p class="is-size-7"><strong>Laundry Instructions:</strong> Please ensure items are ready for pickup on the scheduled date.</p></div><ul>`;
            }
        } catch (e) {
            itemsHtml += '<li>Error parsing booking items.</li>';
        }
        itemsHtml += '</ul>';

        card.innerHTML = `
            <div class="content">
                <p class="is-size-5 has-text-weight-bold">Booking #${booking.booking_id}</p>
                <p><strong>Date:</strong> ${bookingDate}</p>
                <p><strong>Total:</strong> $${booking.total_price.toFixed(2)}</p>
                <p><strong>Items:</strong></p>
                ${itemsHtml}
            </div>
            <div class="card-footer">
                <a class="card-footer-item show-qr-code" data-booking-id="${booking.booking_id}">
                    <span class="icon-text"><span class="icon"><i class="fas fa-qrcode"></i></span><span>Show QR Code and Recipt</span></span>
                </a>
                ${booking.status === 'Pending' ? `<a class="card-footer-item has-text-danger cancel-booking" data-booking-id="${booking.booking_id}">Cancel Booking</a>` : ''}
            </div>
        `;
        return card;
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
        let height = 200; // Base height for header/footer
        height += items.length * lineSpacing; // Add space for each item
        height += 250; // Add space for QR code and footer

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
            items.forEach(item => {
                const itemText = `${item.quantity}x ${item.service_name}`;
                const priceText = `$${(item.price * item.quantity).toFixed(2)}`;
                ctx.fillText(itemText, padding, currentY);
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
        ctx.fillText(`Total: $${booking.total_price.toFixed(2)}`, width - padding, currentY);
        currentY += sectionSpacing * 2;

        // --- 5. Draw QR Code ---
        const qrSize = 128;
        const qr = qrcode(4, 'M');
        qr.addData(String(booking.booking_id));
        qr.make();

        // Manually draw the QR code to ensure it's a perfect square
        const qrModuleSize = qrSize / qr.getModuleCount();
        const qrX = (width - qrSize) / 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(qrX, currentY, qrSize, qrSize);
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
        ctx.fillText('Powered by Mitra | MizProject', width / 2, height - padding + 12);
        
    }

    loadBookings();
});

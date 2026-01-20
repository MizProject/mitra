// This is a shared script for displaying booking receipts in a modal for clients.

let clientSiteConfig = {};

/**
 * Fetches and stores the site configuration for use in receipt generation.
 */
async function loadClientSiteConfig() {
    if (Object.keys(clientSiteConfig).length > 0) return; // Already loaded
    try {
        const response = await fetch('/api/get-site-config');
        if (response.ok) clientSiteConfig = await response.json();
    } catch (error) {
        console.error('Could not load site configuration for receipts.', error);
    }
}

/**
 * Converts method codes into human-readable strings.
 * @param {string} method - The method code (e.g., 'service_pickup').
 * @returns {string} A user-friendly string.
 */
function formatReceiptMethod(method) {
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
 * Fetches details for a given booking ID and displays them in a modal.
 * @param {string} bookingId - The ID of the booking to fetch.
 */
async function fetchAndShowClientReceipt(bookingId) {
    try {
        // Use the new, secure client-side endpoint
        const response = await fetch(`/api/customer/bookings/${bookingId}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Booking #${bookingId} not found.`);
        }
        const booking = await response.json();
        showClientReceiptModal(booking);
    } catch (error) {
        alert(error.message); // Simple alert for user feedback
    }
}

/**
 * Creates and manages the receipt modal.
 * @param {object} booking - The full booking data object.
 */
async function showClientReceiptModal(booking) {
    await loadClientSiteConfig(); // Ensure config is loaded before rendering

    const modal = document.createElement('div');
    modal.className = 'modal is-active';
    modal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Receipt for Booking #${booking.booking_id}</p>
                <button class="delete" aria-label="close"></button>
            </header>
            <section class="modal-card-body">
                <p class="has-text-centered mb-4">This is a copy of your order for reference.</p>
                <canvas id="client-receipt-canvas" style="display: block; margin: 0 auto; border: 1px solid #dbdbdb;"></canvas>
            </section>
            <footer class="modal-card-foot is-justify-content-center">
                <button class="button is-primary" id="download-client-receipt-button">
                    <span class="icon"><i class="fas fa-download"></i></span>
                    <span>Download Receipt</span>
                </button>
                <button class="button" id="close-client-receipt-button">Close</button>
            </footer>
        </div>
    `;
    document.body.appendChild(modal);

    // Generate the receipt on the canvas
    generateClientReceiptCanvas(booking, 'client-receipt-canvas');

    // --- Event Listeners ---
    const cleanup = () => modal.remove();
    modal.querySelector('.delete').addEventListener('click', cleanup);
    modal.querySelector('.modal-background').addEventListener('click', cleanup);
    modal.querySelector('#close-client-receipt-button').addEventListener('click', cleanup);

    modal.querySelector('#download-client-receipt-button').addEventListener('click', () => {
        const canvas = document.getElementById('client-receipt-canvas');
        const link = document.createElement('a');
        link.download = `booking-receipt-${booking.booking_id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

/**
 * Wraps text to fit within a max width on a canvas.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {string} text - The text to wrap.
 * @param {number} maxWidth - The maximum width the text can occupy.
 * @returns {string[]} An array of strings, where each string is a line of wrapped text.
 */
function wrapReceiptText(context, text, maxWidth) {
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
 * Renders the booking details onto a canvas element.
 * @param {object} booking - The booking data.
 * @param {string} canvasId - The ID of the canvas element to draw on.
 */
async function generateClientReceiptCanvas(booking, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = 320;
    let currentY = 0;
    const padding = 20;
    const lineSpacing = 22;
    const sectionSpacing = 15;
    const items = JSON.parse(booking.items || '[]');
    
    // Calculate dynamic height
    let calculatedHeight = 275 + (items.length * lineSpacing) + 250;
    items.forEach(item => {
        const text = `${item.quantity}x ${item.service_name}`;
        const lines = wrapReceiptText(ctx, text, width - (padding * 2) - 80);
        if (lines.length > 1) {
            calculatedHeight += (lines.length - 1) * lineSpacing;
        }
    });

    canvas.width = width;
    canvas.height = calculatedHeight;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, calculatedHeight);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';

    currentY += padding + 30;
    if (clientSiteConfig.page_logo) {
        try {
            const logoImg = new Image();
            logoImg.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => { logoImg.onload = resolve; logoImg.onerror = reject; logoImg.src = clientSiteConfig.page_logo; });
            ctx.drawImage(logoImg, (width - 100) / 2, currentY - 30, 100, 35);
            currentY += 15;
        } catch (e) { /* Ignore logo loading errors */ }
    }
    if (!clientSiteConfig.page_logo && clientSiteConfig.page_name) {
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(clientSiteConfig.page_name, width / 2, currentY);
        currentY += lineSpacing;
    }
    ctx.font = '16px sans-serif';
    ctx.fillText('Order Summary', width / 2, currentY);
    currentY += sectionSpacing;

    if (booking.first_name || booking.last_name) {
        ctx.font = '14px sans-serif';
        ctx.fillText(`For: ${booking.first_name || ''} ${booking.last_name || ''}`.trim(), width / 2, currentY);
        currentY += lineSpacing;
    }

    if (booking.schedule_date) {
        ctx.font = '14px sans-serif';
        ctx.fillText(`Scheduled: ${booking.schedule_date}`, width / 2, currentY);
        currentY += lineSpacing;
    }

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = getClientStatusColorHex(booking.status);
    ctx.fillText(booking.status.toUpperCase(), width / 2, currentY);
    currentY += sectionSpacing * 1.5;

    const drawLine = () => { currentY += sectionSpacing / 2; ctx.fillRect(padding, currentY, width - (padding * 2), 1); currentY += sectionSpacing; };
    drawLine();
    ctx.textAlign = 'left';
    ctx.font = '14px monospace';
    const currency = clientSiteConfig.currency_symbol || '$';
    if (items.length > 0) {
        const priceColumnWidth = 80;
        const maxTextWidth = width - (padding * 2) - priceColumnWidth;

        items.forEach(item => {
            const itemText = `${item.quantity}x ${item.service_name}`;
            const priceText = `${currency}${(item.price * item.quantity).toFixed(2)}`;
            const lines = wrapReceiptText(ctx, itemText, maxTextWidth);

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

    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Total: ${currency}${booking.total_price.toFixed(2)}`, width - padding, currentY);
    currentY += sectionSpacing * 2;

    const qrSize = 128;
    const qr = qrcode(4, 'M');
    qr.addData(String(booking.booking_id));
    qr.make();
    const qrModuleSize = qrSize / qr.getModuleCount();
    const qrX = (width - qrSize) / 2;
    for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
            ctx.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
            ctx.fillRect(qrX + col * qrModuleSize, currentY + row * qrModuleSize, qrModuleSize, qrModuleSize);
        }
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(booking.booking_id, width / 2, currentY + qrSize + sectionSpacing);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Powered by Mitra Systems | MizProject', width / 2, calculatedHeight - padding);
}

/**
 * Gets a hex color code for the canvas based on status.
 * @param {string} status The booking status.
 * @returns {string} A hex color code.
 */
function getClientStatusColorHex(status) {
    switch (status) {
        case 'Completed': return '#238b4d'; // Green
        case 'Processing': return '#20609f'; // Blue
        case 'Canceled': return '#d43f3a'; // Red
        case 'Pending': return '#f0ad4e'; // Orange
        default: return '#4a4a4a'; // Dark Grey
    }
}
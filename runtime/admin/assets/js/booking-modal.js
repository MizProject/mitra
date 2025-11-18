// This is a shared script for displaying booking details in a modal.
// It can be used by both the dashboard and the bookings management page.

let siteConfig = {};

/**
 * Fetches and stores the site configuration for use in receipt generation.
 */
async function loadSiteConfig() {
    if (Object.keys(siteConfig).length > 0) return; // Already loaded
    try {
        const response = await fetch('/api/get-site-config');
        if (response.ok) siteConfig = await response.json();
    } catch (error) {
        console.error('Could not load site configuration for QR codes.', error);
    }
}

/**
 * Fetches details for a given booking ID and displays them in a modal.
 * @param {string} bookingId - The ID of the booking to fetch.
 * @param {function} [onCloseCallback] - Optional callback to run when the modal is closed.
 */
async function fetchAndShowBookingDetails(bookingId, onCloseCallback) {
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Booking #${bookingId} not found.`);
        }
        const booking = await response.json();
        showBookingDetailsModal(booking, onCloseCallback);
    } catch (error) {
        // A simple alert is better for a modal context.
        alert(error.message);
    }
}

/**
 * Creates and manages the detailed booking information modal with tabs.
 * @param {object} booking - The full booking data object.
 * @param {function} [onCloseCallback] - Optional callback to run when the modal is closed.
 */
async function showBookingDetailsModal(booking, onCloseCallback) {
    await loadSiteConfig(); // Ensure config is loaded before rendering

    const modal = document.createElement('div');
    modal.className = 'modal is-active';
    modal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Booking Details: #${booking.booking_id}</p>
                <button class="delete" aria-label="close"></button>
            </header>
            <section class="modal-card-body">
                <div class="tabs is-boxed">
                    <ul>
                        <li class="is-active" data-tab="info-tab"><a><span class="icon is-small"><i class="fas fa-info-circle"></i></span><span>General Info</span></a></li>
                        <li data-tab="action-tab"><a><span class="icon is-small"><i class="fas fa-cogs"></i></span><span>Action</span></a></li>
                        <li data-tab="generate-tab"><a><span class="icon is-small"><i class="fas fa-receipt"></i></span><span>Generate</span></a></li>
                    </ul>
                </div>
                <div class="content">
                    <div id="info-tab" class="content-tab"></div>
                    <div id="action-tab" class="content-tab" style="display: none;"></div>
                    <div id="generate-tab" class="content-tab" style="display: none;"></div>
                </div>
            </section>
        </div>
    `;
    document.body.appendChild(modal);

    // --- Populate Tabs ---
    populateInfoTab(booking);
    populateActionTab(booking);
    populateGenerateTab(booking);

    // --- Tab Switching Logic ---
    const tabs = modal.querySelectorAll('.tabs li');
    const tabContents = modal.querySelectorAll('.content-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('is-active'));
            tab.classList.add('is-active');
            const target = modal.querySelector(`#${tab.dataset.tab}`);
            tabContents.forEach(content => content.style.display = 'none');
            target.style.display = 'block';
        });
    });

    // --- Cleanup ---
    const cleanup = () => {
        modal.remove();
        if (onCloseCallback) onCloseCallback();
    };
    modal.querySelector('.delete').addEventListener('click', cleanup);
    modal.querySelector('.modal-background').addEventListener('click', cleanup);
}

function populateInfoTab(booking) {
    const container = document.getElementById('info-tab');
    const items = JSON.parse(booking.items || '[]');
    let itemsHtml = items.map(item => `<li>${item.quantity}x ${item.service_name} ($${item.price.toFixed(2)} each)</li>`).join('');

    container.innerHTML = `
        <p><strong>Customer:</strong> ${booking.first_name} ${booking.last_name}</p>
        <p><strong>Contact:</strong> <a href="mailto:${booking.email}">${booking.email}</a> | ${booking.phone_number || 'No phone'}</p>
        <p><strong>Booking Date:</strong> ${new Date(booking.booking_date).toLocaleString()}</p>
        <p><strong>Total Price:</strong> $${booking.total_price.toFixed(2)}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsHtml}</ul>
    `;
}

function populateActionTab(booking) {
    const container = document.getElementById('action-tab');
    container.innerHTML = `
        <p class="mb-3">Update the status of this booking.</p>
        <div class="field is-horizontal">
            <div class="field-label is-normal"><label class="label">Status</label></div>
            <div class="field-body"><div class="field"><div class="control">
                <div class="select">
                    <select id="modal-status-changer">
                        <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${booking.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Canceled" ${booking.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
                    </select>
                </div>
            </div></div></div>
        </div>
        <div class="notification is-hidden mt-4" id="action-status"></div>
    `;

    container.querySelector('#modal-status-changer').addEventListener('change', async (event) => {
        const newStatus = event.target.value;
        const statusBox = container.querySelector('#action-status');
        statusBox.className = 'notification is-hidden mt-4';
        try {
            const response = await fetch(`/api/admin/bookings/${booking.booking_id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status.');
            statusBox.className = 'notification is-success mt-4';
            statusBox.textContent = `Status updated to ${newStatus}.`;
        } catch (error) {
            statusBox.className = 'notification is-danger mt-4';
            statusBox.textContent = error.message;
        }
    });
}

function populateGenerateTab(booking) {
    const container = document.getElementById('generate-tab');
    container.innerHTML = `
        <p>Generate a receipt for offline reference or printing.</p>
        <canvas id="receipt-canvas" class="mt-4" style="display: block; margin: 0 auto; border: 1px solid #dbdbdb;"></canvas>
        <button class="button is-primary mt-4" id="download-receipt-button">Download Receipt</button>
    `;

    generateReceiptCanvas(booking, 'receipt-canvas');

    container.querySelector('#download-receipt-button').addEventListener('click', () => {
        const canvas = document.getElementById('receipt-canvas');
        const link = document.createElement('a');
        link.download = `booking-receipt-${booking.booking_id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

async function generateReceiptCanvas(booking, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = 320;
    let currentY = 0;
    const padding = 20;
    const lineSpacing = 22;
    const sectionSpacing = 15;
    const items = JSON.parse(booking.items || '[]');
    let height = 250 + (items.length * lineSpacing) + 250;

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';

    currentY += padding + 30;
    if (siteConfig.page_logo) {
        try {
            const logoImg = new Image();
            logoImg.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => { logoImg.onload = resolve; logoImg.onerror = reject; logoImg.src = siteConfig.page_logo; });
            ctx.drawImage(logoImg, (width - 100) / 2, currentY - 30, 100, 35);
            currentY += 15;
        } catch (e) {}
    }
    if (!siteConfig.page_logo && siteConfig.page_name) {
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(siteConfig.page_name, width / 2, currentY);
        currentY += lineSpacing;
    }
    ctx.font = '16px sans-serif';
    ctx.fillText('Order Form', width / 2, currentY);
    currentY += sectionSpacing;

    if (booking.first_name || booking.last_name) {
        ctx.font = '14px sans-serif';
        ctx.fillText(`For: ${booking.first_name || ''} ${booking.last_name || ''}`.trim(), width / 2, currentY);
        currentY += lineSpacing;
    }

    const drawLine = () => { currentY += sectionSpacing / 2; ctx.fillRect(padding, currentY, width - (padding * 2), 1); currentY += sectionSpacing; };
    drawLine();
    ctx.textAlign = 'left';
    ctx.font = '14px monospace';
    if (items.length > 0) {
        items.forEach(item => {
            ctx.fillText(`${item.quantity}x ${item.service_name}`, padding, currentY);
            ctx.textAlign = 'right';
            ctx.fillText(`$${(item.price * item.quantity).toFixed(2)}`, width - padding, currentY);
            ctx.textAlign = 'left';
            currentY += lineSpacing;
        });
    }
    drawLine();

    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Total: $${booking.total_price.toFixed(2)}`, width - padding, currentY);
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
    ctx.fillText('Not an official receipt. For reference only.', width / 2, height - padding - 12);
    ctx.fillText('Powered by Mitra | MizProject', width / 2, height - padding);
}
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('bookings-table-container');
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');
    const statusSelect = document.getElementById('filter-status');
    const scheduleDateInput = document.getElementById('filter-schedule-date');
    const applyButton = document.getElementById('apply-filters');
    const clearButton = document.getElementById('clear-filters');
    let siteConfig = {};

    // --- Socket.IO Connection ---
    // Dynamically load the Socket.IO client script from the server
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => {
        const socket = io();
        socket.on('booking_update', () => fetchBookings());
    };
    document.head.appendChild(script);

    async function loadConfigAndBookings() {
        await loadSiteConfig();
        await fetchBookings();
    }

    async function loadSiteConfig() {
        try {
            const response = await fetch('/api/get-site-config');
            if (response.ok) siteConfig = await response.json();
        } catch (error) {
            console.error('Could not load site configuration.', error);
        }
    }

    async function fetchBookings() {
        const params = new URLSearchParams();
        if (sortBySelect && sortBySelect.value) params.append('sortBy', sortBySelect.value);
        if (sortOrderSelect && sortOrderSelect.value) params.append('sortOrder', sortOrderSelect.value);
        if (statusSelect && statusSelect.value) params.append('status', statusSelect.value);
        if (scheduleDateInput && scheduleDateInput.value) params.append('scheduleDate', scheduleDateInput.value);

        try {
            const response = await fetch(`/api/admin/search-bookings?${params.toString()}`);
            const bookings = await response.json();
            renderBookingsTable(bookings);
        } catch (error) {
            container.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    }

    function renderBookingsTable(bookings) {
        const currency = siteConfig.currency_symbol || '$';
        if (bookings.length === 0) {
            container.innerHTML = '<div class="notification is-info">No bookings found matching your criteria.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table is-bordered is-striped is-narrow is-hoverable is-fullwidth';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Scheduled</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;

        const tbody = table.querySelector('tbody');
        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <!-- <td class="is-clickable" data-booking-id="${booking.booking_id}">${booking.booking_id}</td> --!>
                <td class="is-clickable" data-booking-id="${booking.booking_id}">${booking.booking_id}</td>
                <td>${booking.first_name || ''} ${booking.last_name || ''} (${booking.email})</td>
                <td>${new Date(booking.booking_date).toLocaleString()}</td>
                <td>${booking.schedule_date || 'N/A'} ${booking.schedule_time ? '@ ' + booking.schedule_time : ''}</td>
                <td>${currency}${booking.total_price.toFixed(2)}</td>
                <td><span class="tag ${getStatusColor(booking.status)}">${booking.status}</span></td>
                <td>
                    <div class="select is-small">
                        <select data-booking-id="${booking.booking_id}" class="status-changer">
                            <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Processing" ${booking.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Completed" ${booking.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Canceled" ${booking.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
                        </select>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        container.innerHTML = '';
        container.appendChild(table);

        // Add event listener for opening the details modal
        tbody.addEventListener('click', (event) => {
            // Prevent modal if clicking on the status dropdown
            if (event.target.closest('.status-changer') || event.target.closest('.select')) {
                return;
            }

            const row = event.target.closest('tr');
            if (row) {
                const bookingId = row.querySelector('[data-booking-id]').dataset.bookingId;
                fetchAndShowBookingDetails(bookingId, fetchBookings); // Reload data when modal closes
            }
        });

        // Add event listeners for status changes
        container.querySelectorAll('.status-changer').forEach(select => {
            select.addEventListener('change', async (event) => {
                const bookingId = event.target.dataset.bookingId;
                const newStatus = event.target.value;
                
                try {
                    const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    if (!response.ok) throw new Error('Failed to update status.');
                    // Refresh the data to show changes
                    fetchBookings();
                } catch (error) {
                    alert('Error updating status: ' + error.message);
                }
            });
        });
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Completed': return 'is-success';
            case 'Processing': return 'is-info';
            case 'Canceled': return 'is-danger';
            case 'Pending': return 'is-warning';
            default: return 'is-light';
        }
    }

    if (applyButton) applyButton.addEventListener('click', fetchBookings);
    
    if (clearButton) clearButton.addEventListener('click', () => {
        if (sortBySelect) sortBySelect.value = 'booking_date';
        if (sortOrderSelect) sortOrderSelect.value = 'DESC';
        if (statusSelect) statusSelect.value = '';
        if (scheduleDateInput) scheduleDateInput.value = '';
        fetchBookings();
    });

    loadConfigAndBookings();
});
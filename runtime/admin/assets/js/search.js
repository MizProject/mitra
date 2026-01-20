document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const resultsContainer = document.getElementById('search-results-container');
    let siteConfig = {};

    async function loadSiteConfig() {
        try {
            const response = await fetch('/api/get-site-config');
            if (response.ok) siteConfig = await response.json();
        } catch (error) {
            console.error('Could not load site configuration.', error);
        }
    }

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = searchForm.querySelector('button[type="submit"]');
        button.classList.add('is-loading');
        resultsContainer.innerHTML = '<progress class="progress is-small is-primary" max="100">Loading...</progress>';

        const bookingId = document.getElementById('search-booking-id').value;
        const name = document.getElementById('search-name').value;
        const email = document.getElementById('search-email').value;
        const status = document.getElementById('search-status').value;
        const startDate = document.getElementById('search-start-date').value;
        const endDate = document.getElementById('search-end-date').value;

        const query = new URLSearchParams({ bookingId, name, email, status, startDate, endDate }).toString();

        try {
            const response = await fetch(`/api/admin/search-bookings?${query}`);
            if (!response.ok) throw new Error('Search request failed.');
            const bookings = await response.json();
            renderResultsTable(bookings);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        } finally {
            button.classList.remove('is-loading');
        }
    });

    function renderResultsTable(bookings) {
        const currency = siteConfig.currency_symbol || '$';
        if (bookings.length === 0) {
            resultsContainer.innerHTML = '<p>No bookings found matching your criteria.</p>';
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
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;

        const tbody = table.querySelector('tbody');
        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.className = 'is-clickable';
            row.dataset.bookingId = booking.booking_id;
            row.innerHTML = `
                <td>${booking.booking_id}</td>
                <td>${booking.first_name || ''} ${booking.last_name || ''} (${booking.email})</td>
                <td>${new Date(booking.booking_date).toLocaleString()}</td>
                <td>${booking.schedule_date || 'N/A'} ${booking.schedule_time ? '@ ' + booking.schedule_time : ''}</td>
                <td>${currency}${booking.total_price.toFixed(2)}</td>
                <td><span class="tag ${getStatusColor(booking.status)}">${booking.status}</span></td>
            `;
            tbody.appendChild(row);
        });

        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(table);

        // Add event listener for opening the details modal
        tbody.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
            if (row && row.dataset.bookingId) {
                fetchAndShowBookingDetails(row.dataset.bookingId);
            }
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

    searchForm.addEventListener('reset', () => {
        resultsContainer.innerHTML = '<p>Enter search criteria above and press "Search" to see results.</p>';
    });

    loadSiteConfig();
});
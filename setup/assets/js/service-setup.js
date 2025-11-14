/**
 * Calls the backend API to set up the database tables for the selected services.
 * @param {string[]} selectedServices - An array of service keys like ['hotel', 'repair'].
 * @param {HTMLElement} statusBox - The notification element to display status messages.
 * @returns {Promise<void>}
 */
async function setupServiceTables(selectedServices, statusBox) {
  try {
    statusBox.className = 'notification is-info';
    statusBox.textContent = 'Initializing selected service tables...';

    const response = await fetch('/api/setup-servicing-tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: selectedServices }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'An unknown error occurred.');
    }

    statusBox.className = 'notification is-success';
    statusBox.textContent = result.message;
  } catch (error) {
    statusBox.className = 'notification is-danger';
    statusBox.textContent = `Error: ${error.message}`;
  }
}
/**
 * Mitra Time Validation Script
 * Fetches site configuration and enforces business hours on time inputs.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to find the schedule time input. Adjust ID if necessary.
    const timeInput = document.querySelector('input[type="time"]') || document.getElementById('schedule-time');

    if (!timeInput) return;

    try {
        const response = await fetch('/api/get-site-config');
        if (!response.ok) throw new Error('Failed to fetch config');
        
        const config = await response.json();

        if (config.opening_time && config.closing_time) {
            // Set min and max attributes for the time input
            timeInput.min = config.opening_time;
            timeInput.max = config.closing_time;

            // Add change listener for immediate feedback
            timeInput.addEventListener('change', () => {
                const selectedTime = timeInput.value;
                if (!selectedTime) return;

                if (selectedTime < config.opening_time || selectedTime > config.closing_time) {
                    alert(`Please select a time between ${config.opening_time} and ${config.closing_time}.`);
                    timeInput.value = ''; // Clear invalid input
                }
            });
        }
    } catch (error) {
        console.error("Mitra: Failed to load site configuration for time validation.", error);
    }
});
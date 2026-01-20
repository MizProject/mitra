document.addEventListener('DOMContentLoaded', () => {
    const startScanButton = document.getElementById('start-scan-button');
    const qrFileInput = document.getElementById('qr-file-input');
    const qrResultContainer = document.getElementById('qr-reader-result');

    /**
     * Fetches and displays the main dashboard statistics.
     */
    async function loadDashboardStats() {
        try {
            const response = await fetch('/api/admin/dashboard-stats');
            if (!response.ok) throw new Error('Failed to load dashboard stats.');
            const stats = await response.json();

            // Update the counter elements with the fetched data
            document.getElementById('pending-total-count').textContent = stats.pendingTotal;
            document.getElementById('processing-total-count').textContent = stats.processingTotal;
            document.getElementById('completed-today-count').textContent = stats.completedToday;
            document.getElementById('canceled-today-count').textContent = stats.canceledToday;

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // You could display an error in one of the stat boxes if needed
        }
    }

    if (startScanButton) {
        // The shared script will handle loading site config when needed.
        startScanButton.addEventListener('click', () => {
            openScannerModal();
        });
    }

    if (qrFileInput) {
        qrFileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            qrResultContainer.innerHTML = `<p class="has-text-info">Scanning file...</p>`;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Create a canvas to draw the image onto
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0, img.width, img.height);

                    // Get the image data from the canvas
                    const imageData = context.getImageData(0, 0, img.width, img.height);
                    
                    // Use jsQR to scan for a code
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        fetchAndShowBookingDetails(code.data);
                        qrResultContainer.innerHTML = ''; // Clear "Scanning file..." message
                        e.target.value = ''; // Reset file input
                    } else {
                        const friendlyMessage = "Could not find a QR code in the selected file. Please try a different image with better clarity, contrast, and a straight-on angle.";
                        qrResultContainer.innerHTML = `<div class="notification is-danger">${friendlyMessage}</div>`;
                        e.target.value = ''; // Reset file input
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Listen for clicks on the dynamically added "Rescan" button
    qrResultContainer.addEventListener('click', (event) => {
        if (event.target.id === 'rescan-button') {
            openScannerModal();
        }
    });

    /**
     * Creates and displays a modal with the QR code scanner.
     */
    function openScannerModal() {
        qrResultContainer.innerHTML = ''; // Clear previous results

        // 1. Create Modal Structure
        const modal = document.createElement('div');
        modal.className = 'modal is-active';
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Scan Booking QR Code</p>
                    <button class="delete" aria-label="close"></button>
                </header>
                <section class="modal-card-body">
                    <div id="modal-qr-reader" style="width: 100%;"></div>
                </section>
            </div>
        `;
        document.body.appendChild(modal);

        // 2. Initialize Scanner
        const html5QrCode = new Html5Qrcode("modal-qr-reader");
        let hasScanned = false; // Guard flag to prevent multiple scans
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        // 3. Define Callbacks and Cleanup
        const cleanup = () => {
            if (html5QrCode && html5QrCode.isScanning) {
                // It's crucial to stop the scanner before removing the element.
                // The .catch() is important as stop() can throw an error if already stopped.
                html5QrCode.stop().catch(err => console.error("Failed to stop scanner on close.", err));
            }
            modal.remove();
        };

        // Add close listeners
        modal.querySelector('.delete').addEventListener('click', cleanup);
        modal.querySelector('.modal-background').addEventListener('click', cleanup);

        // 4. Start Scanning
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                const onScanSuccessCallback = (decodedText) => {
                    if (hasScanned) return; // If we've already processed a scan, do nothing.
                    hasScanned = true; // Set the flag to true.
                    cleanup(); // Immediately stop the scanner and close the modal.
                    fetchAndShowBookingDetails(decodedText); // This function is now in booking-modal.js
                };
                const cameraId = cameras[0].id; // Use the first available camera
                html5QrCode.start(cameraId, config, onScanSuccessCallback)
                    .catch(err => {
                        qrResultContainer.innerHTML = `<div class="notification is-danger">Error starting scanner: ${err}</div>`;
                        cleanup();
                    });
            } else {
                qrResultContainer.innerHTML = `<div class="notification is-danger">No cameras found on this device.</div>`;
                cleanup();
            }
        }).catch(err => console.error("Camera permissions error:", err));
    }

    // --- Initial Load ---
    loadDashboardStats();
});
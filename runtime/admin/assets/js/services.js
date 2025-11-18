document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('services-list-container');
    const addServiceButton = document.getElementById('add-service-button');
    const cropperModal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    let cropperImageElement; // Cropper.js v2 <cropper-image> instance
    let cropperSelectionElement; // Cropper.js v2 <cropper-selection> instance
    let croppedImageBlob = null; // To store the cropped image blob

    async function loadServices() {
        try {
            const response = await fetch('/api/admin/services'); // Fetch the services
            const services = await response.json();
            renderServices(services);
        } catch (error) {
            listContainer.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    }

    function renderServices(services) {
        listContainer.innerHTML = '';
        if (services.length === 0) {
            listContainer.innerHTML = '<p>No services found. Add one using the form.</p>';
            return;
        }
        services.forEach(service => {
            const serviceEl = document.createElement('div');
            serviceEl.className = 'box is-flex is-justify-content-space-between is-align-items-center';
            serviceEl.innerHTML = `
                <div>
                    <img src="${service.image_url}" class="service-preview mr-3">
                    <strong>${service.service_name}</strong>
                    <span class="tag ${service.is_active ? 'is-success' : 'is-light'} ml-2">${service.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="buttons">
                    <button class="button is-small is-info edit-button" data-id="${service.service_id}">Edit</button>
                    <button class="button is-small is-danger delete-button" data-id="${service.service_id}">Delete</button>
                </div>
            `;
            listContainer.appendChild(serviceEl);
        });
    }

    function showServiceModal(service = null) {
        const modalTitle = service ? `Edit Service: ${service.service_name}` : 'Add New Service';
        const submitButtonText = service ? 'Save Changes' : 'Create Service';

        const modal = document.createElement('div');
        modal.className = 'modal is-active';
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">${modalTitle}</p>
                    <button class="delete" aria-label="close"></button>
                </header>
                <section class="modal-card-body">
                    <form id="modal-service-form">
                        <input type="hidden" id="modal-service-id" value="${service ? service.service_id : ''}">
                        <div class="field"><label class="label">Service Name</label><div class="control"><input class="input" type="text" id="modal-service-name" value="${service ? service.service_name : ''}" required></div></div>
                        <div class="field">
                            <label class="label">Service Type</label>
                            <div class="control">
                                <div class="select is-fullwidth">
                                    <select id="modal-service-type" required>
                                        <!-- Options will be dynamically loaded by JavaScript -->
                                    </select>
                                </div>
                            </div><p class="help">e.g., 'hotel', 'repair', 'food'</p></div>
                        <div class="field"><label class="label">Description</label><div class="control"><textarea class="textarea" id="modal-service-description">${service ? service.description : ''}</textarea></div><p class="help">A brief description of the service.</p></div>
                        <div class="field"><label class="label">Base Price</label><div class="control"><input class="input" type="number" step="0.01" id="modal-service-price" value="${service ? service.base_price : '0.00'}"></div></div>
                        <div class="field"><label class="label">Image</label><div class="control"><input class="input" type="file" id="modal-service-image" accept="image/*"></div><p class="help">${service ? 'Leave empty to keep the current image.' : 'An image is required.'}</p></div>
                        <div class="field"><label class="checkbox"><input type="checkbox" id="modal-service-active" ${service ? (service.is_active ? 'checked' : '') : 'checked'}> Active</label></div>
                    </form>
                    <div class="notification is-hidden mt-4" id="modal-form-status"></div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-primary" id="submit-modal-form">${submitButtonText}</button>
                    <button class="button" id="cancel-modal-form">Cancel</button>
                </footer>
            </div>
        `;
        document.body.appendChild(modal);

        const cleanup = () => modal.remove();
        modal.querySelector('.delete').addEventListener('click', cleanup);
        modal.querySelector('.modal-background').addEventListener('click', cleanup);
        modal.querySelector('#cancel-modal-form').addEventListener('click', cleanup);

        const modalServiceImageInput = modal.querySelector('#modal-service-image');
        // Populate service type dropdown
        const serviceTypeSelect = modal.querySelector('#modal-service-type');
        // These types are based on the available service detail tables from setup
        const serviceTypes = ['hotel', 'repair', 'food', 'laundry']; 
        serviceTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
            serviceTypeSelect.appendChild(option);
        });

        // If editing, select the current service's type
        if (service && service.service_type) {
            serviceTypeSelect.value = service.service_type;
        }

        // Reset the blob on modal open
        croppedImageBlob = null; // Clear any previously cropped image

        // --- Image Cropping Logic ---
        modalServiceImageInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {


                    // Get the Cropper.js v2 elements
                    cropperImageElement = cropperModal.querySelector('cropper-image');
                    cropperSelectionElement = cropperModal.querySelector('cropper-selection');

                    if (!cropperImageElement || !cropperSelectionElement) {
                        console.error("Cropper.js v2 elements not found in modal.");
                        return;
                    }

                    cropperImageElement.setAttribute('src', e.target.result); // Load image into cropper-image
                    cropperModal.classList.add('is-active');
                };
                reader.readAsDataURL(file);
            }
        });

        // Cropper modal buttons
        cropperModal.querySelector('#apply-crop-button').addEventListener('click', async () => {
            if (cropperSelectionElement) {
                // Use the $toCanvas method of cropper-selection to get the cropped image
                const canvas = await cropperSelectionElement.$toCanvas();
                canvas.toBlob((blob) => {
                    croppedImageBlob = blob;
                    cropperModal.classList.remove('is-active');
                    // Optionally, show a preview of the cropped image in the main modal
                    // For now, we just store the blob.
                }, 'image/jpeg', 0.9); // Adjust format and quality as needed
            }
        });

        const closeCropperModal = () => {
            cropperModal.classList.remove('is-active');
            // No explicit destroy needed for v2 components, just hide the modal
            cropperImageElement.src = ''; // Clear image from cropper
            // Clear the file input in the main modal if cropping was cancelled
            modalServiceImageInput.value = '';
            croppedImageBlob = null;
        };
        cropperModal.querySelector('.delete').addEventListener('click', closeCropperModal);
        cropperModal.querySelector('.modal-background').addEventListener('click', closeCropperModal);
        cropperModal.querySelector('#cancel-crop-button').addEventListener('click', closeCropperModal);

        modal.querySelector('#submit-modal-form').addEventListener('click', async () => {
            const statusBox = modal.querySelector('#modal-form-status');
            const submitButton = modal.querySelector('#submit-modal-form');

            const formData = new FormData();
            formData.append('service_name', modal.querySelector('#modal-service-name').value);
            formData.append('service_type', modal.querySelector('#modal-service-type').value);
            formData.append('description', modal.querySelector('#modal-service-description').value);
            formData.append('base_price', modal.querySelector('#modal-service-price').value);
            formData.append('is_active', modal.querySelector('#modal-service-active').checked);

            if (croppedImageBlob) {
                formData.append('image', croppedImageBlob, 'cropped_image.jpg'); // Use a generic filename
            }

            const serviceId = modal.querySelector('#modal-service-id').value;
            const method = serviceId ? 'PUT' : 'POST';
            const url = serviceId ? `/api/admin/services/${serviceId}` : '/api/admin/services';

            submitButton.classList.add('is-loading');

            try {
                const response = await fetch(url, { method, body: formData });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);

                statusBox.className = 'notification is-success mt-4';
                statusBox.textContent = result.message;
                loadServices();
                setTimeout(cleanup, 1500); // Close modal on success

            } catch (error) {
                statusBox.className = 'notification is-danger mt-4';
                statusBox.textContent = error.message;
            } finally {
                submitButton.classList.remove('is-loading');
            }
        });
    }

    listContainer.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        // Edit button
        if (target.classList.contains('edit-button')) {
            const serviceId = target.dataset.id;
            const response = await fetch('/api/admin/services');
            const services = await response.json();
            const serviceToEdit = services.find(s => s.service_id == serviceId);
            if (serviceToEdit) showServiceModal(serviceToEdit);
        }

        // Delete button
        if (target.classList.contains('delete-button')) {
            const serviceId = target.dataset.id;
            if (confirm('Are you sure you want to delete this service? This cannot be undone.')) {
                try {
                    const response = await fetch(`/api/admin/services/${serviceId}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    loadServices();
                } catch (error) {
                    alert(`Error deleting service: ${error.message}`);
                }
            }
        }
    });

    addServiceButton.addEventListener('click', () => {
        showServiceModal(null); // Pass null to indicate a new service
    });

    loadServices();
});
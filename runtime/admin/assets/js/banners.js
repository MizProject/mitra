document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('banners-list-container');
    const addBannerButton = document.getElementById('add-banner-button');

    async function loadBanners() {
        try {
            const response = await fetch('/api/admin/banners');
            if (!response.ok) throw new Error('Failed to load banners.');
            const banners = await response.json();
            renderBanners(banners);
        } catch (error) {
            listContainer.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    }

    function renderBanners(banners) {
        listContainer.innerHTML = '';
        if (banners.length === 0) {
            listContainer.innerHTML = '<p>No banners found. Add one with the <i class="fas fa-plus"></i> Add New Banner.</p>';
            return;
        }
        banners.forEach(banner => {
            const bannerEl = document.createElement('div');
            bannerEl.className = 'box is-flex is-justify-content-space-between is-align-items-center';
            bannerEl.innerHTML = `
                <div>
                    <img src="${banner.image_url}" class="banner-preview mr-3">
                    <strong>${banner.banner_name}</strong>
                    <span class="tag ${banner.is_active ? 'is-success' : 'is-light'} ml-2">${banner.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="buttons">
                    <button class="button is-small is-info edit-button" data-id="${banner.banner_id}">Edit</button>
                    <button class="button is-small is-danger delete-button" data-id="${banner.banner_id}">Delete</button>
                </div>
            `;
            listContainer.appendChild(bannerEl);
        });
    }

    function showBannerModal(banner = null) {
        const modalTitle = banner ? `Edit Banner: ${banner.banner_name}` : 'Add New Banner';
        const submitButtonText = banner ? 'Save Changes' : 'Create Banner';

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
                    <form id="modal-banner-form">
                        <input type="hidden" id="modal-banner-id" value="${banner ? banner.banner_id : ''}">
                        <div class="field"><label class="label">Banner Name</label><div class="control"><input class="input" type="text" id="modal-banner-name" value="${banner ? banner.banner_name : ''}" required></div></div>
                        <div class="field"><label class="label">Image</label><div class="control"><input class="input" type="file" id="modal-banner-image" accept="image/*"></div><p class="help">${banner ? 'Leave empty to keep the current image.' : 'An image is required.'}</p></div>
                        <div class="field"><label class="label">Link URL (Optional)</label><div class="control"><input class="input" type="url" id="modal-banner-link" value="${banner && banner.link_url ? banner.link_url : ''}"></div></div>
                        <div class="field"><label class="label">Display Order</label><div class="control"><input class="input" type="number" id="modal-banner-order" value="${banner ? banner.display_order : '0'}"></div></div>
                        <div class="field"><label class="checkbox"><input type="checkbox" id="modal-banner-active" ${banner ? (banner.is_active ? 'checked' : '') : 'checked'}> Active</label></div>
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

        modal.querySelector('#submit-modal-form').addEventListener('click', async () => {
            const form = modal.querySelector('#modal-banner-form');
            const statusBox = modal.querySelector('#modal-form-status');
            const submitButton = modal.querySelector('#submit-modal-form');

            const formData = new FormData();
            formData.append('banner_name', modal.querySelector('#modal-banner-name').value);
            formData.append('link_url', modal.querySelector('#modal-banner-link').value);
            formData.append('display_order', modal.querySelector('#modal-banner-order').value);
            formData.append('is_active', modal.querySelector('#modal-banner-active').checked);
            
            const imageFile = modal.querySelector('#modal-banner-image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const bannerId = modal.querySelector('#modal-banner-id').value;
            const method = bannerId ? 'PUT' : 'POST';
            const url = bannerId ? `/api/admin/banners/${bannerId}` : '/api/admin/banners';

            submitButton.classList.add('is-loading');

            try {
                const response = await fetch(url, { method, body: formData });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);

                statusBox.className = 'notification is-success mt-4';
                statusBox.textContent = result.message;
                loadBanners();
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
            const bannerId = target.dataset.id;
            const response = await fetch('/api/admin/banners');
            const banners = await response.json();
            const bannerToEdit = banners.find(b => b.banner_id == bannerId);
            if (bannerToEdit) showBannerModal(bannerToEdit);
        }

        // Delete button
        if (target.classList.contains('delete-button')) {
            const bannerId = target.dataset.id;
            if (confirm('Are you sure you want to delete this banner? This cannot be undone.')) {
                try {
                    const response = await fetch(`/api/admin/banners/${bannerId}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    loadBanners();
                } catch (error) {
                    alert(`Error deleting banner: ${error.message}`);
                }
            }
        }
    });

    addBannerButton.addEventListener('click', () => {
        showBannerModal(null); // Pass null to indicate a new banner
    });

    loadBanners();
});

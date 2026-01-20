document.addEventListener('DOMContentLoaded', () => {
    const adminsContainer = document.getElementById('admins-list-container');
    const customersContainer = document.getElementById('customers-list-container');
    const addAdminButton = document.getElementById('add-admin-button');
    const modal = document.getElementById('admin-form-modal');
    const modalTitle = document.getElementById('admin-modal-title');
    const adminForm = document.getElementById('admin-form');
    const statusBox = document.getElementById('admin-form-status');
    const saveButton = document.getElementById('save-admin-button');
    
    const tabs = document.querySelectorAll('.tabs li');
    const tabContents = document.querySelectorAll('.content-tab');

    let currentAdminId = null; // To track if we are editing or adding

    const openModal = (admin = null) => {
        currentAdminId = admin ? admin.admin_id : null;
        modalTitle.textContent = admin ? `Edit Admin: ${admin.username}` : 'Add New Admin';

        adminForm.innerHTML = `
            <input type="hidden" id="admin-id" value="${admin ? admin.admin_id : ''}">
            <div class="field">
                <label class="label">Username</label>
                <div class="control"><input class="input" type="text" id="admin-username" value="${admin ? admin.username : ''}" required></div>
            </div>
            <div class="field">
                <label class="label">Password</label>
                <div class="control"><input class="input" type="password" id="admin-password" placeholder="${admin ? 'Leave blank to keep current password' : 'Required'}"></div>
            </div>
            <div class="field">
                <label class="label">Confirm Password</label>
                <div class="control"><input class="input" type="password" id="admin-password-confirm" placeholder="${admin ? 'Leave blank to keep current password' : 'Required'}"></div>
            </div>
            <div class="field">
                <label class="label">Privilege</label>
                <div class="control"><div class="select is-fullwidth">
                    <select id="admin-privilege">
                        <option value="admin" ${admin && admin.privilege === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="viewer" ${admin && admin.privilege === 'viewer' ? 'selected' : ''}>Viewer (Read-only)</option>
                    </select>
                </div></div>
            </div>
        `;
        statusBox.classList.add('is-hidden');
        modal.classList.add('is-active');
    };

    const closeModal = () => {
        modal.classList.remove('is-active');
        adminForm.reset();
    };

    const loadAdmins = async () => {
        try {
            const response = await fetch('/api/admin/accounts');
            if (!response.ok) throw new Error('Failed to load accounts.');
            const admins = await response.json();

            adminsContainer.innerHTML = '';
            const table = document.createElement('table');
            table.className = 'table is-fullwidth is-striped is-hoverable';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Privilege</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            admins.forEach(admin => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${admin.admin_id}</td>
                    <td>${admin.username}</td>
                    <td><span class="tag is-info">${admin.privilege}</span></td>
                    <td>
                        <div class="buttons">
                            <button class="button is-small is-warning edit-admin-button" data-id="${admin.admin_id}">
                                <span class="icon"><i class="fas fa-edit"></i></span>
                            </button>
                            <button class="button is-small is-danger delete-admin-button" data-id="${admin.admin_id}" data-username="${admin.username}">
                                <span class="icon"><i class="fas fa-trash"></i></span>
                            </button>
                            <button class="button is-small is-info regenerate-recovery-code-button" data-id="${admin.admin_id}" data-username="${admin.username}">
                                <span class="icon"><i class="fas fa-key"></i></span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            adminsContainer.appendChild(table);
        } catch (error) {
            adminsContainer.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await fetch('/api/admin/customers');
            if (!response.ok) throw new Error('Failed to load customers.');
            const customers = await response.json();

            customersContainer.innerHTML = '';
            if (customers.length === 0) {
                customersContainer.innerHTML = '<p>No customers have registered yet.</p>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'table is-fullwidth is-striped is-hoverable';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Date Registered</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            customers.forEach(customer => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${customer.customer_id}</td>
                    <td>${customer.first_name || ''} ${customer.last_name || ''}</td>
                    <td><a href="mailto:${customer.email}">${customer.email}</a></td>
                    <td>${customer.phone_number || 'N/A'}</td>
                    <td>${new Date(customer.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
            customersContainer.appendChild(table);
        } catch (error) {
            customersContainer.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    };

    const handleSave = async () => {
        saveButton.classList.add('is-loading');
        statusBox.classList.add('is-hidden');

        const password = document.getElementById('admin-password').value;
        const passwordConfirm = document.getElementById('admin-password-confirm').value;

        if (password !== passwordConfirm) {
            statusBox.textContent = 'Passwords do not match.';
            statusBox.className = 'notification is-danger mt-4';
            saveButton.classList.remove('is-loading');
            return;
        }

        const data = {
            username: document.getElementById('admin-username').value,
            privilege: document.getElementById('admin-privilege').value,
        };
        if (password) {
            data.password = password;
        }

        const url = currentAdminId ? `/api/admin/accounts/${currentAdminId}` : '/api/admin/accounts';
        const method = currentAdminId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save admin.');

            closeModal();
            loadAdmins();
        } catch (error) {
            statusBox.textContent = error.message;
            statusBox.className = 'notification is-danger mt-4';
        } finally {
            saveButton.classList.remove('is-loading');
        }
    };

    const handleDelete = async (adminId, username) => {
        if (!confirm(`Are you sure you want to delete the admin account "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/accounts/${adminId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to delete admin.');
            loadAdmins();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleRegenerateRecoveryCode = async (adminId, username) => {
        if (!confirm(`Are you sure you want to regenerate the recovery code for the admin account "${username}"? The old code will be invalid.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/accounts/${adminId}/regenerate-recovery-code`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to regenerate recovery code.');

            // Display the new recovery code in a modal
            const modalHTML = `
                <div class="modal is-active" id="new-recovery-code-modal">
                    <div class="modal-background"></div>
                    <div class="modal-card">
                        <header class="modal-card-head">
                            <p class="modal-card-title">New Recovery Code</p>
                            <button class="delete" aria-label="close"></button>
                        </header>
                        <section class="modal-card-body has-text-centered">
                            <p>The recovery code for "${username}" has been regenerated. Save this code in a secure location:</p>
                            <div class="notification is-info">${result.newRecoveryCode}</div>
                        </section>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const newRecoveryCodeModal = document.getElementById('new-recovery-code-modal');
            newRecoveryCodeModal.querySelector('.delete').addEventListener('click', () => {
                document.getElementById('new-recovery-code-modal').remove();
            });
            newRecoveryCodeModal.querySelector('.modal-background').addEventListener('click', () => {
                document.getElementById('new-recovery-code-modal').remove();
            });
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // --- Event Listeners ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('is-active'));
            tab.classList.add('is-active');

            const target = document.getElementById(tab.dataset.tab);
            tabContents.forEach(content => content.classList.add('is-hidden'));
            target.classList.remove('is-hidden');
        });
    });

    addAdminButton.addEventListener('click', () => openModal());

    adminsContainer.addEventListener('click', async (event) => {
        const regenerateButton = event.target.closest('.regenerate-recovery-code-button');
        const editButton = event.target.closest('.edit-admin-button');
        const deleteButton = event.target.closest('.delete-admin-button');


        if (editButton) {
            const adminId = editButton.dataset.id;
            try {
                const response = await fetch(`/api/admin/accounts/${adminId}`);
                if (!response.ok) throw new Error('Could not fetch admin details.');
                const admin = await response.json();
                openModal(admin);
            } catch (error) {
                alert(error.message);
            }
        }

        if (deleteButton) {
            const adminId = deleteButton.dataset.id;
            const username = deleteButton.dataset.username;
            handleDelete(adminId, username);
        }

        if (regenerateButton) {
            const adminId = regenerateButton.dataset.id;
            const username = regenerateButton.dataset.username;
            handleRegenerateRecoveryCode(adminId, username);
        }
    });

    saveButton.addEventListener('click', handleSave);
    modal.querySelectorAll('.delete, .modal-background, #cancel-admin-button').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    // Initial load
    loadAdmins();
    loadCustomers();
});

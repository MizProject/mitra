// Core UI for the Setup

// Variables needed
let embed = null;


// Configure what services you offer and how the database records
// the stuff

function createcredentials() {

}

function pingDB() {

}

function imagesitebanner() {

}

// function smsprovider() {

// }


function interactivePaging(page, target) {
    // Target: dynamicBodyCard
    // Page: page
    // Do some case switches
    switch(page) {
        case 1:
            // TOC
            target.innerHTML = `
            <h2 class="title is-3 has-text-centered">Mitra's Terms and Conditions</h2>
            <div class="terms-content" style="height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; ">
                <pre style="white-space: pre-wrap; word-wrap: break-word;">${embed}</pre>
            </div>
            <div class="has-text-centered is-centered" style="margin-top: 20px">
                <label>
                    <input type="checkbox" data-toggle-button="next-tc" id="toc-accept-checkbox">
                        I accept the Terms and Conditions
                    </input>
                </label>
            `
            break;
        case 2:
            // Auth
            target.innerHTML = `
            <h2 class="title is-3 has-text-centered">Create an Admin Account</h2>
            <div class="field register-form">
                <label class="label">Username</label>
                <div class="control has-icons-left has-icons-right">
                    <input class="input" type="text" placeholder="Admin Username" id="admin-username">
                    <span class="icon is-small is-left">
                        <i class="fas fa-user"></i>
                    </span>
                    <span class="icon is-small is-right">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
                <p class="help " id="status-username"></p>
            </div>
            <div class="field register-form">
                <label class="label">Password</label>
                <div class="control has-icons-left has-icons-right">
                    <input class="input" type="password" placeholder="Admin Password" id="admin-password">
                    <span class="icon is-small is-left">
                        <i class="fas fa-lock"></i>
                    </span>
                    <span class="icon is-small is-right">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
                <p class="help " id="status-password"></p>
            </div>
            <div class="field register-form">
                <label class="label">Confirm Password</label>
                <div class="control has-icons-left has-icons-right">
                    <input class="input" type="password" placeholder="Confirm Password" id="admin-password-confirm">
                    <span class="icon is-small is-left">
                        <i class="fas fa-lock"></i>
                    </span>
                    <span class="icon is-small is-right">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
                <p class="help " id="status-confirm-password"></p>
            </div>
            <div class="field register-form">
                <label class="checkbox">
                <input type="checkbox" id="generate-recovery-code" />
                    <i class="fas fa-solid fa-key"></i>
                    Also Generate Recovery Code
                </label>
            </div>
            <div class="buttons is-centered">
                <button class="button" id="add-admin-account">
                    <i class="fas fa-user-plus" style="margin-right: 5px;"></i>
                    Create Admin Account
                </button>
                <button class="button" id="check-db-connection">
                    <i class="fas fa-database" style="margin-right: 5px;"></i>
                    Check Database Connection
                </button>
                <button class="button" id="check-auth">
                    <i class="fas fa-key" style="margin-right: 5px;"></i>
                    Check Authentication
                </button>
            </div>
            <p class="help" id="status-auth"></p>
            `
            // When page 2 loads, check session storage.
            if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
                document.getElementById("next-btn").disabled = false;
            } else {
                document.getElementById("next-btn").disabled = true;
            }
            break;
        case 3:
            // Color Picker
            // Note: Use @thednp/color-picker library
            // Then output as CSS at runtime/client/assets/css/maincolor.css
            target.innerHTML = `
                <h2 class="title is-3 has-text-centered">Configure Your Site's Appearance</h2>

                <!-- Site Name -->
                <div class="field">
                    <label class="label">Site Name</label>
                    <div class="control">
                        <input class="input" type="text" placeholder="My Awesome Business" id="site-name">
                    </div>
                </div>

                <!-- Color Pickers -->
                <div class="columns is-centered">
                    <div class="column is-narrow">
                        <div class="field configure-styling" style="text-align: center; position: relative;">
                            <label class="label">Primary Site Color</label>
                            <div class="control">
                                <div class="buttons has-addons is-centered">
                                    <button class="button" id="color-picker-button-primary" style="width: 150px;">#ffffff</button>
                                </div>
                            </div>
                            <p class="help" id="status-color-primary"></p>
                            <div id="color-picker-card-primary" class="card color-picker-card" style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); z-index: 20; display: none; padding: 10px;">
                                <div id="picker-container-primary"></div>
                            </div>
                        </div>
                    </div>
                    <div class="column is-narrow">
                       <div class="field configure-styling" style="text-align: center; position: relative;">
                            <label class="label">Secondary Site Color</label>
                            <div class="control">
                                <button class="button" id="color-picker-button-secondary" style="width: 150px;">#000000</button>
                            </div>
                            <p class="help" id="status-color-secondary"></p>
                            <div id="color-picker-card-secondary" class="card color-picker-card" style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); z-index: 20; display: none; padding: 10px;">
                                <div id="picker-container-secondary"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Uploads -->
                <div class="field">
                    <label class="label">Site's Logo (e.g., for favicon)</label>
                    <div class="control">
                        <input class="input" type="file" id="site-logo" accept="image/png, image/jpeg, image/webp, image/bmp">
                    </div>
                </div>
                <div class="field">
                    <label class="label">Site's Banner (optional)</label>
                    <div class="control">
                        <input class="input" type="file" id="site-banner" accept="image/png, image/jpeg, image/webp">
                    </div>
                </div>

                <!-- Actions -->
                <div class="buttons is-centered" style="margin-top: 20px;">
                    <button class="button is-info" id="show-preset-modal-button"><i class="fas fa-palette" style="margin-right: 5px;"></i> Color Presets</button>
                    <button class="button is-primary" id="save-config-button">
                        <span class="icon"><i class="fas fa-save"></i></span>
                        <span>Save Configuration</span>
                    </button>
                </div>
                <div class="notification is-hidden" id="config-status-box"></div>

                <!-- Preset Modal -->
                <div class="modal" id="preset-color-modal">
                    <div class="modal-background"></div>
                    <div class="modal-card">
                        <header class="modal-card-head">
                            <p class="modal-card-title">Select a Color Preset</p>
                            <button class="delete" aria-label="close"></button>
                        </header>
                        <section class="modal-card-body">
                            <div id="preset-themes-container"></div>
                        </section>
                        <footer class="modal-card-foot is-justify-content-center">
                            <button class="button is-success" id="apply-colors-button">Apply</button>
                            <button class="button" id="cancel-colors-button">Cancel</button>
                        </footer>
                    </div>
                </div>
            `;

            // Maybe add some form of previews like buttons and stuff
            // The wrapper needs position: relative for the absolute positioned popup.

            const setupColorPicker = (type) => {
                const colorPickerButton = document.getElementById(`color-picker-button-${type}`);
                const colorPickerCard = document.getElementById(`color-picker-card-${type}`);
                const pickerContainer = document.getElementById(`picker-container-${type}`);
                const colorStatus = document.getElementById(`status-color-${type}`);

                // Load saved color or use default
                const savedColor = sessionStorage.getItem(`${type}Color`);
                const initialColor = savedColor || (type === 'primary' ? '#ffffff' : '#000000');

                // Function to update the button's appearance
                const updateButtonAppearance = (color) => {
                    const hexColor = color.hex.slice(0, 7);
                    colorPickerButton.style.backgroundColor = hexColor;
                    colorPickerButton.style.color = color.rgba[3] > 0.5 && (color.rgba[0] * 0.299 + color.rgba[1] * 0.587 + color.rgba[2] * 0.114) > 186 ? '#000' : '#fff';
                    colorPickerButton.textContent = hexColor;
                };

                // --- Picker Initialization ---
                const picker = new Picker({
                    parent: pickerContainer, // Attach the picker inside our card
                    popup: false, // Render it inline inside the card
                    alpha: false,
                    editorFormat: 'hex',
                    color: initialColor,
                    onChange: updateButtonAppearance // Use the callback here
                });

                const updateButtonColor = (color) => {
                    const hexColor = color.hex.slice(0, 7);
                    colorPickerButton.style.backgroundColor = hexColor;
                    colorPickerButton.style.color = color.rgba[3] > 0.5 && (color.rgba[0]*0.299 + color.rgba[1]*0.587 + color.rgba[2]*0.114) > 186 ? '#000' : '#fff';
                    colorPickerButton.textContent = hexColor;
                };
                
                picker.onDone = (color) => {
                    const hexColor = color.hex.slice(0, 7);
                    colorStatus.textContent = `Selected Color: ${hexColor}`;
                    colorPickerCard.style.display = 'none'; // Hide the card on confirmation
                    // Store the selected color in sessionStorage
                    sessionStorage.setItem(`${type}Color`, hexColor);
                    updateButtonColor(color);
                };

                // Attach picker instance to the button for later access
                colorPickerButton.__picker = picker;

                // Immediately update the button to reflect the initial color (saved or default)
                if (savedColor) {
                    updateButtonAppearance(picker.color);
                }

                // --- Event Handlers ---
                colorPickerButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const otherType = type === 'primary' ? 'secondary' : 'primary';
                    document.getElementById(`color-picker-card-${otherType}`).style.display = 'none';
                    const isHidden = colorPickerCard.style.display === 'none';
                    colorPickerCard.style.display = isHidden ? 'block' : 'none';
                });
            };

            setupColorPicker('primary');
            setupColorPicker('secondary');

            // --- Preset Modal Logic ---
            const showPresetButton = document.getElementById('show-preset-modal-button');
            const presetModal = document.getElementById('preset-color-modal');
            const themesContainer = document.getElementById('preset-themes-container');
            const applyButton = document.getElementById('apply-colors-button');
            const cancelButton = document.getElementById('cancel-colors-button');
            const modalCloseButtons = presetModal.querySelectorAll('.delete, .modal-background, #cancel-colors-button');
            let selectedTheme = null;

            // Populate the preset modal with themes from color-default.js
            for (const themeName in colorThemes) {
                const theme = colorThemes[themeName];
                const themeElement = document.createElement('div');
                themeElement.className = 'box is-clickable';
                themeElement.dataset.themeName = themeName;
                themeElement.innerHTML = `
                    <p class="title is-5">${themeName}</p>
                    <div class="columns is-mobile">
                        <div class="column"><div style="height: 40px; background-color: ${theme.primary}; border-radius: 4px;"></div><p class="is-size-7 has-text-centered">Primary</p></div>
                        <div class="column"><div style="height: 40px; background-color: ${theme.secondary}; border-radius: 4px; border: 1px solid #dbdbdb;"></div><p class="is-size-7 has-text-centered">Secondary</p></div>
                    </div>
                `;
                themesContainer.appendChild(themeElement);

                themeElement.addEventListener('click', () => {
                    // Remove 'is-active' from previously selected
                    themesContainer.querySelectorAll('.box').forEach(el => el.classList.remove('is-primary-themed'));
                    // Add 'is-active' to clicked
                    themeElement.classList.add('is-primary-themed');
                    selectedTheme = themeName;
                });
            }

            const closePresetModal = () => presetModal.classList.remove('is-active');

            showPresetButton.addEventListener('click', () => presetModal.classList.add('is-active'));
            modalCloseButtons.forEach(button => {
                button.addEventListener('click', closePresetModal);
            });

            applyButton.addEventListener('click', () => {
                if (selectedTheme && colorThemes[selectedTheme]) {
                    const theme = colorThemes[selectedTheme];
                    const primaryPicker = document.getElementById('color-picker-button-primary').__picker;
                    const secondaryPicker = document.getElementById('color-picker-button-secondary').__picker;

                    primaryPicker.setColor(theme.primary, true);
                    primaryPicker.onDone(primaryPicker.color);

                    secondaryPicker.setColor(theme.secondary, true);
                    secondaryPicker.onDone(secondaryPicker.color);
                }
                closePresetModal();
            });

            // --- Save Configuration Logic ---
            const saveButton = document.getElementById('save-config-button');
            const statusBox = document.getElementById('config-status-box');

            const showStatus = (message, type = 'is-info') => {
                statusBox.textContent = message;
                statusBox.className = `notification ${type}`;
            };

            saveButton.addEventListener('click', async () => {
                const siteName = document.getElementById('site-name').value;
                const primaryColor = sessionStorage.getItem('primaryColor');
                const secondaryColor = sessionStorage.getItem('secondaryColor');
                const logoInput = document.getElementById('site-logo');
                const bannerInput = document.getElementById('site-banner');

                if (!siteName || !primaryColor) {
                    showStatus('Site Name and Primary Color are required.', 'is-danger');
                    return;
                }

                saveButton.classList.add('is-loading');
                showStatus('Saving configuration...', 'is-info');

                const formData = new FormData();
                formData.append('siteName', siteName);
                formData.append('primaryColor', primaryColor);
                if (secondaryColor) formData.append('secondaryColor', secondaryColor);
                if (logoInput.files[0]) formData.append('logo', logoInput.files[0]);
                if (bannerInput.files[0]) formData.append('banner', bannerInput.files[0]);

                try {
                    const response = await fetch('/api/save-site-config', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    showStatus(result.message || 'Configuration saved!', response.ok ? 'is-success' : 'is-danger');
                } catch (error) {
                    showStatus('Error saving configuration: ' + error.message, 'is-danger');
                } finally {
                    saveButton.classList.remove('is-loading');
                }
            });

            // Hide cards when clicking anywhere else on the page
            document.addEventListener('click', (e) => {
                const primaryCard = document.getElementById('color-picker-card-primary');
                const primaryButton = document.getElementById('color-picker-button-primary');
                const secondaryCard = document.getElementById('color-picker-card-secondary');
                const secondaryButton = document.getElementById('color-picker-button-secondary');

                // If these elements don't exist (because we are on a different page),
                // just exit the event handler.
                if (!primaryCard || !secondaryCard) {
                    return;
                }

                let clickedInsidePrimary = primaryCard.contains(e.target) || e.target === primaryButton;
                let clickedInsideSecondary = secondaryCard.contains(e.target) || e.target === secondaryButton;

                if (!clickedInsidePrimary) {
                    primaryCard.style.display = 'none';
                }
                if (!clickedInsideSecondary) {
                    secondaryCard.style.display = 'none';
                }
            });
            break;
        case 4:
            // E-commerce / Servicing Setup
            target.innerHTML = `
                <h2 class="title is-3 has-text-centered">Select Services to Offer</h2>
                <p class="subtitle is-6 has-text-centered">Choose the types of services your business will provide. This will set up the necessary database tables.</p>

                <div class="field" id="service-options-container">
                    <label class="checkbox">
                        <input type="checkbox" value="hotel"> Hotel / Accomodation
                    </label><br>
                    <label class="checkbox">
                        <input type="checkbox" value="repair"> Tech Repair
                    </label><br>
                    <label class="checkbox">
                        <input type="checkbox" value="food"> Food & Restaurant
                    </label><br>
                    <label class="checkbox">
                        <input type="checkbox" value="laundry"> Laundry Service
                    </label><br>
                </div>

                <div class="buttons is-centered" style="margin-top: 20px;">
                    <button class="button is-primary" id="setup-servicing-button">
                        <span class="icon"><i class="fas fa-cogs"></i></span>
                        <span>Initialize Services</span>
                    </button>
                </div>
                <div class="notification is-hidden" id="servicing-status-box"></div>
            `;

            const setupBtn = document.getElementById('setup-servicing-button');
            const servicingStatusBox = document.getElementById('servicing-status-box');

            setupBtn.addEventListener('click', async () => {
                setupBtn.classList.add('is-loading');
                servicingStatusBox.className = 'notification is-info is-hidden';

                const selectedServices = Array.from(document.querySelectorAll('#service-options-container input:checked')).map(cb => cb.value);

                if (selectedServices.length === 0) {
                    servicingStatusBox.textContent = 'Please select at least one service type to initialize.';
                    servicingStatusBox.className = 'notification is-warning';
                    setupBtn.classList.remove('is-loading');
                    return;
                }

                // This function will be defined in a new file: service-setup.js
                await setupServiceTables(selectedServices, servicingStatusBox);
                setupBtn.classList.remove('is-loading');
            });
            break;
    }
};

function createBenchmarkModal() {
    const modalHTML = `
        <div class="modal is-active" id="benchmark-modal">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Database Benchmark</p>
                    <button class="delete" aria-label="close"></button>
                </header>
                <section class="modal-card-body" id="benchmark-results-body">
                    <p>Running benchmark... This will take about 30 seconds. Please wait.</p>
                    <progress class="progress is-small is-primary is-indeterminate" max="100"></progress>
                </section>
                <footer class="modal-card-foot">
                    <button class="button" id="close-benchmark-modal">Close</button>
                </footer>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('benchmark-modal');
    const closeModal = () => modal.remove();

    modal.querySelector('.delete').addEventListener('click', closeModal);
    modal.querySelector('.modal-background').addEventListener('click', closeModal);
    modal.querySelector('#close-benchmark-modal').addEventListener('click', closeModal);
}

function displayBenchmarkResults(results) {
    const resultsBody = document.getElementById('benchmark-results-body');

    const calculateStats = (times) => {
        if (times.length === 0) return { avg: 0, min: 0, max: 0 };
        const sum = times.reduce((a, b) => a + b, 0);
        const avg = sum / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        return {
            avg: avg.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2)
        };
    };

    const seqWriteStats = calculateStats(results.sequentialWriteTimes);
    const bulkWriteStats = calculateStats(results.bulkWriteTimes);
    const readStats = calculateStats(results.sequentialReadTimes);

    resultsBody.innerHTML = `
        <p>Benchmark finished in <strong>${results.totalTime.toFixed(2)} seconds</strong>.</p>
        <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
                <tr>
                    <th>Test</th>
                    <th>Operations</th>
                    <th>Avg. Time (ms)</th>
                    <th>Min. Time (ms)</th>
                    <th>Max. Time (ms)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Sequential Writes (10s)</td>
                    <td>${results.sequentialWrites.toLocaleString()}</td>
                    <td>${seqWriteStats.avg}</td>
                    <td>${seqWriteStats.min}</td>
                    <td>${seqWriteStats.max}</td>
                </tr>
                <tr>
                    <td>Bulk Writes (10s, ${results.bulkSize} per op)</td>
                    <td>${results.bulkWrites.toLocaleString()}</td>
                    <td>${bulkWriteStats.avg}</td>
                    <td>${bulkWriteStats.min}</td>
                    <td>${bulkWriteStats.max}</td>
                </tr>
                <tr>
                    <td>Read All (${results.sequentialReads.toLocaleString()} records)</td>
                    <td>1</td>
                    <td>${readStats.avg}</td>
                    <td>${readStats.min}</td>
                    <td>${readStats.max}</td>
                </tr>
            </tbody>
        </table>
        <p class="is-size-7"><em>Note: The benchmark table has been cleaned up.</em></p>
    `;
}


window.addEventListener('DOMContentLoaded', (event) => {
    // Assets should be fetched first
    fetch('/assets/setup/others/toc/toc.txt').then(response => response.text()).then(data => {
        embed = data;
    });
    // UI Framework starts
    const dynamicBodyCard = document.getElementById("dynamic-body-card");
    const backBtn = document.getElementById("back-btn");
    const nextBtn = document.getElementById("next-btn"); // This should be declared before its usage

    let page = 1;

    // Initial display of welcome
    // The page one of the code
    dynamicBodyCard.innerHTML = `
    <h2 class="title is-3 has-text-centered">Welcome to Mitra!</h2>
    <p class="has-text-centered">Our system that process online orders!</p>
    <p class="has-text-centered">Please, press the button to continue</p>
    <div class="buttons is-centered">
        <button class="button is-primary" id="start-setup">Continue</button>   
    </div>
    ` ;
    // Retrieve the startSetup button AFTER it has been added to the DOM
    const startSetup = document.getElementById('start-setup');

    if (startSetup) {
        startSetup.addEventListener('click', () => {
            console.log("Start Setup btn pressed");
            // Since the user has pressed the button to start
            // Hide the button, and also permanently leave the navbuttons present
            startSetup.style.display = "none";
            backBtn.style.display = "inline-block";
            nextBtn.style.display = "inline-block";
            interactivePaging(page, dynamicBodyCard);
            // First, values need to be checked
            if (page === 1) {
                // We will not count the intro as 1
                // So we call the case 1 as page 1
                page = 1;
                nextBtn.disabled = true;
                interactivePaging(1, dynamicBodyCard);
            } 
        });

    };


    dynamicBodyCard.addEventListener('change', function(event) {
        if (event.target.id === 'toc-accept-checkbox') {
            if (event.target.checked) {
                nextBtn.disabled = false;
            } else {
                nextBtn.disabled = true;
            }
        }
    } 
);

dynamicBodyCard.addEventListener('click', async (event) => {
    if (event.target.id === 'check-db-connection') {
        const button = event.target;
        button.classList.add('is-loading');
        button.disabled = true;

        createBenchmarkModal();

        // The runDBBenchmark function is available from dbtest.js
        const results = await runDBBenchmark();
        
        displayBenchmarkResults(results);

        button.classList.remove('is-loading');
        button.disabled = false;
    }
});


if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        page = Math.min(page + 1, 4); // Adjusted max page number
        interactivePaging(page, dynamicBodyCard);
    });
};

if (backBtn) {
    backBtn.addEventListener('click', () => {
        page = Math.max(page - 1, 1);
        interactivePaging(page, dynamicBodyCard);
    });
};


dynamicBodyCard.addEventListener('click', async (event) => {
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    const passwordConfirmInput = document.getElementById('admin-password-confirm');
    const recoveryCheckbox = document.getElementById('generate-recovery-code');
    const authStatus = document.getElementById('status-auth');

    if (event.target.id === 'add-admin-account') {
        const button = event.target;
        button.classList.add('is-loading');
        authStatus.textContent = '';

        const username = usernameInput.value;
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        authStatus.className = 'help'; // Reset status color

        if (password !== passwordConfirm) {
            authStatus.textContent = 'Passwords do not match.';
            authStatus.className = 'help is-danger';
            button.classList.remove('is-loading');
            return;
        }
        
        const recovery_code = recoveryCheckbox.checked ? Math.random().toString(36).slice(-8) : null;

        // Call the new streamlined function from authenticate.js
        const result = await createAdminAccount(username, password, recovery_code);

        if (result.ok) {
            authStatus.textContent = `Admin account "${username}" created successfully! You can now check authentication.`;
            authStatus.className = 'help is-success';
        } else { // No 'finally' keyword needed here
            authStatus.textContent = `Error: ${result.error}`;
            authStatus.className = 'help is-danger';
        }
        button.classList.remove('is-loading'); // This will always run after the if/else block
    }

    // --- Check Authentication ---
    if (event.target.id === 'check-auth') {
        const button = event.target;
        button.classList.add('is-loading');
        authStatus.textContent = '';
        authStatus.className = 'help'; // Reset status color

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Call the new streamlined function from authenticate.js
        const result = await loginAdmin(username, password);

        if (result.ok) {
            authStatus.textContent = 'Authentication successful! You can now proceed.';
            authStatus.className = 'help is-success';
            nextBtn.disabled = false;
            sessionStorage.setItem('isAdminAuthenticated', 'true');
        } else {
            authStatus.textContent = `Authentication failed: ${result.error || 'Please check username and password.'}`;
            authStatus.className = 'help is-danger';
            nextBtn.disabled = true;
            sessionStorage.removeItem('isAdminAuthenticated');
        }

        button.classList.remove('is-loading');
    }
});



});
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
    };
}

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
            // else if (page === 2) {
            //     page = 2;
            //     interactivePaging(2, dynamicBodyCard);
            // }
        
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
        page = Math.min(page + 1, 2);
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
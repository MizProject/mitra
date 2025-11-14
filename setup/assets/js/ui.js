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
                <label class="label">Username</label
                <div class="control has-icons-left has-icons-right">
                    <input class="input is-success" type="text" placeholder="Text input">
                    <span class="icon is-small is-left">
                        <i class="fas fa-user"></i>
                    </span>
                    <span class="icon is-small is-right">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
            </div>

            </div>
            `
            break;
            `
    };
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


    

});
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

            `
    };
}


window.addEventListener('DOMContentLoaded', (event) => {
    // Assets should be fetched first
    fetch('/assets/setup/others/tos/tos.txt').then(response => response.text()).then(data => {
        embed = data;
    })
    // UI Framework starts
    const dynamicBodyCard = document.getElementById("dynamic-body-card");
    const backBtn = document.getElementById("back-btn");
    const nextBtn = document.getElementById("next-btn");
    const startSetup = document.getElementById('start-setup');

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

    if (startSetup) {
        startSetup.addEventListener('click', () => {
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
                interactivePaging(1, dynamicBodyCard);
            }
        
        });

    };

    if (nextBtn) {
        
    }

    



});
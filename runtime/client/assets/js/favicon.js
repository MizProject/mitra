function setfavicon (iconURL ) {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');

    // Checks if page does not have favicon tag
    if (!link) {
        link = document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    // load the logo
    link.href = iconURL;
    
    // Check if logo had an issue displaying
    link.onerror = function() {
        console.warn("Error: Could not load the logo");
        link.href = "/assets/runtime/data/images/stockdefault.png";
    }


}
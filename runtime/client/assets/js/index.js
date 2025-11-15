document.addEventListener('DOMContentLoaded', () => {

        /**
         * Fetches site configuration and updates the UI.
         */
        async function fetchSiteConfig() {
            try {
                const response = await fetch('/api/get-site-config');
                if (!response.ok) throw new Error('Failed to load site configuration.');
                const config = await response.json();

                if (config.page_name) {
                    document.title = config.page_name;
                    document.querySelector('#navbar-brand-logo .is-size-4').textContent = config.page_name;
                    document.getElementById('footer-business-name').textContent = config.page_name;
                }

                if (config.page_logo) {
                    const logoImg = document.createElement('img');
                    logoImg.src = config.page_logo;
                    logoImg.alt = config.page_name || 'Logo';
                    logoImg.style.maxHeight = '28px'; // Bulma navbar item height
                    const brandLink = document.getElementById('navbar-brand-logo');
                    brandLink.innerHTML = ''; // Clear text
                    brandLink.appendChild(logoImg);

                    // Set the page's favicon
                    setfavicon(config.page_logo);
                }

                if (config.banner_image) {
                    document.getElementById('hero-section').style.backgroundImage = `url('${config.banner_image}')`;
                }

                if (config.primary_color) {
                    document.getElementById('hero-section').style.backgroundColor = config.primary_color;
                }

            } catch (error) {
                console.error('Error fetching site config:', error);
            }
        }

        /**
         * Fetches available services and populates the service list.
         */
        async function fetchServices() {
            const servicesList = document.getElementById('services-list');
            try {
                const response = await fetch('/api/get-services');
                if (!response.ok) throw new Error('Failed to load services.');
                const services = await response.json();

                servicesList.innerHTML = ''; // Clear the loading progress bar

                if (services.length === 0) {
                    servicesList.innerHTML = '<div class="column has-text-centered"><p>No services are currently available. Please check back later.</p></div>';
                    return;
                }

                services.forEach(service => {
                    const column = document.createElement('div');
                    column.className = 'column is-one-third';

                    // Use service image or a placeholder
                    const imageUrl = service.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image';

                    column.innerHTML = `
                        <div class="card service-card">
                            <div class="card-image">
                                <figure class="image is-4by3">
                                    <img src="${imageUrl}" alt="${service.service_name || 'Service Image'}">
                                </figure>
                            </div>
                            <div class="card-content">
                                <p class="title is-4">${service.service_name || 'Unnamed Service'}</p>
                                <p class="subtitle is-6">${service.description || 'No description available.'}</p>
                                <p class="is-size-5 has-text-weight-bold has-text-primary" style="color: var(--primary-color) !important;">$${Number(service.base_price).toFixed(2)}</p>
                            </div>
                            <footer class="card-footer"><a href="#" class="card-footer-item has-text-weight-bold" style="color: var(--primary-color);">Book Now</a></footer>
                        </div>
                    `;
                    servicesList.appendChild(column);
                });

            } catch (error) {
                console.error('Error fetching services:', error);
                servicesList.innerHTML = '<div class="column has-text-centered"><p class="has-text-danger">Could not load services at this time.</p></div>';
            }
        }

        /**
         * Sets up the mobile navigation burger menu.
         */
        function setupNavbarBurger() {
            const burger = document.querySelector('.navbar-burger');
            const menu = document.querySelector('.navbar-menu');
            if (burger && menu) {
                burger.addEventListener('click', () => {
                    burger.classList.toggle('is-active');
                    menu.classList.toggle('is-active');
                });
            }
        }

        /**
         * Fetches banners from the API and sets up the promotion slider.
         */
        async function fetchAndSetupBanners() {
            const sliderContainer = document.querySelector('.promotion-slides');
            const promotionSection = document.getElementById('promotion-section');
            if (!sliderContainer || !promotionSection) return;

            try {
                const response = await fetch('/api/get-banners');
                if (!response.ok) throw new Error('Failed to load banners.');
                const banners = await response.json();

                if (banners.length === 0) {
                    promotionSection.style.display = 'none'; // Hide section if no banners
                    return;
                }

                sliderContainer.innerHTML = ''; // Clear placeholders

                banners.forEach((banner, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'promotion-slide';
                    if (index === 0) slide.classList.add('is-active');

                    // Create two images: one for the blurred background, one for the contained foreground.
                    const imageHTML = `
                        <img src="${banner.image_url}" class="slide-bg-image" alt="Promotional Banner Background">
                        <img src="${banner.image_url}" class="slide-main-image" alt="Promotional Banner">
                    `;
                    slide.innerHTML = banner.link_url ? `<a href="${banner.link_url}">${imageHTML}</a>` : imageHTML;
                    
                    sliderContainer.appendChild(slide);
                });

                // Now that slides are in the DOM, set up the controls
                const slides = document.querySelectorAll('.promotion-slide');
                let currentSlide = 0;

                const showSlide = (index) => {
                    const offset = -index * 100;
                    sliderContainer.style.transform = `translateX(${offset}%)`;
                };

                document.querySelector('.slider-nav.next').addEventListener('click', () => {
                    currentSlide = (currentSlide + 1) % slides.length;
                    showSlide(currentSlide);
                });

                document.querySelector('.slider-nav.prev').addEventListener('click', () => {
                    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                    showSlide(currentSlide);
                });

            } catch (error) {
                console.error('Error fetching banners:', error);
                promotionSection.style.display = 'none'; // Hide on error
            }
        }

        // Initialize the page
        fetchSiteConfig();
        fetchServices();
        setupNavbarBurger();
        fetchAndSetupBanners();
    });
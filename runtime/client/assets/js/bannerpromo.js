document.addEventListener('DOMContentLoaded', () => {
    const promotionSection = document.getElementById('promotion-section');
    const sliderContainer = document.getElementById('promotion-slides-container');
    const nextButton = document.querySelector('.slider-nav.next');
    const prevButton = document.querySelector('.slider-nav.prev');

    if (!promotionSection || !sliderContainer) {
        console.error("Banner components not found. Aborting banner setup.");
        if (promotionSection) promotionSection.style.display = 'none';
        return;
    }

    async function fetchAndSetupBanners() {
        try {
            const response = await fetch('/api/get-banners');
            if (!response.ok) throw new Error('Failed to load banners.');
            const banners = await response.json();

            if (banners.length === 0) {
                promotionSection.style.display = 'none';
                return;
            }

            sliderContainer.innerHTML = ''; // Clear any placeholders

            banners.forEach(banner => {
                const slide = document.createElement('div');
                slide.className = 'promotion-slide';

                const imageHTML = `
                    <div class="slide-content-wrapper">
                        <img src="${banner.image_url}" class="slide-bg-image" alt="Promotional Banner Background">
                        <img src="${banner.image_url}" class="slide-main-image" alt="Promotional Banner">
                    </div>
                `;
                slide.innerHTML = banner.link_url ? `<a href="${banner.link_url}" target="_blank">${imageHTML}</a>` : imageHTML;

                sliderContainer.appendChild(slide);
            });

            const slides = sliderContainer.querySelectorAll('.promotion-slide');
            let currentSlide = 0;

            const showSlide = (index) => {
                const offset = -index * 100;
                sliderContainer.style.transform = `translateX(${offset}%)`;
            };

            if (slides.length <= 1) {
                nextButton.style.display = 'none';
                prevButton.style.display = 'none';
            } else {
                nextButton.addEventListener('click', () => {
                    currentSlide = (currentSlide + 1) % slides.length;
                    showSlide(currentSlide);
                });
                prevButton.addEventListener('click', () => {
                    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                    showSlide(currentSlide);
                });
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            promotionSection.style.display = 'none';
        }
    }
    fetchAndSetupBanners();
});
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('all-reviews-container');
    const sortSelect = document.getElementById('sort-reviews');
    let allReviews = [];

    async function fetchReviews() {
        try {
            const res = await fetch('/api/public/reviews');
            if (!res.ok) throw new Error('Failed to fetch');
            allReviews = await res.json();
            renderReviews();
        } catch (err) {
            container.innerHTML = '<div class="column is-12"><div class="notification is-danger">Failed to load reviews.</div></div>';
        }
    }

    function renderReviews() {
        const sortValue = sortSelect.value;
        let sorted = [...allReviews];

        if (sortValue === 'newest') {
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortValue === 'oldest') {
            sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortValue === 'highest') {
            sorted.sort((a, b) => b.rating - a.rating);
        } else if (sortValue === 'lowest') {
            sorted.sort((a, b) => a.rating - b.rating);
        }

        if (sorted.length === 0) {
            container.innerHTML = '<div class="column is-12"><div class="notification is-info">No reviews yet.</div></div>';
            return;
        }

        container.innerHTML = sorted.map(r => `
            <div class="column is-one-third">
                <div class="card review-card">
                    <div class="card-content">
                        <div class="media">
                            <div class="media-content">
                                <p class="title is-5">${r.is_anonymous ? 'Anonymous (' + Math.random().toString(36).substring(2, 8) + ')' : (r.reviewer_name || 'Anonymous')} <small class="is-size-7">on ${r.service_name}</small></p>
                                <p class="subtitle is-6 has-text-grey">
                                    ${new Date(r.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div class="content">
                            <div class="mb-2">
                                ${generateStars(r.rating)}
                            </div>
                            <p>"${r.comment || 'No comment provided.'}"</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function generateStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += `<i class="${i < rating ? 'fas' : 'far'} fa-star review-star"></i>`;
        }
        return stars;
    }

    sortSelect.addEventListener('change', renderReviews);
    fetchReviews();
});
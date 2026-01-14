document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('product-grid');
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');
    const searchInput = document.getElementById('searchInput');

    let allProducts = [];

    // Fetch Products
    fetch('/products.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data;
            renderProducts(allProducts);
        })
        .catch(err => {
            console.error(err);
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">Failed to load products. Ensure server is running and products.json exists.</div>';
        });

    // Render Function
    function renderProducts(products) {
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">No products found.</div>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');

            // Image handling
            const imageSrc = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x400?text=No+Image';

            // Price Processing
            const displayPrice = product.discount_price || product.price || 'N/A';
            const oldPrice = product.discount_price ? product.price : '';

            // Calculate Discount
            let discountBadge = '';
            if (product.discount_price && product.price) {
                const current = parseInt(product.discount_price.replace(/\D/g, ''));
                const original = parseInt(product.price.replace(/\D/g, ''));
                if (original > current) {
                    const percent = Math.round(((original - current) / original) * 100);
                    discountBadge = `<div class="discount-badge">-${percent}%</div>`;
                }
            }

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${imageSrc}" alt="${product.title}" loading="lazy">
                    ${discountBadge}
                </div>
                <div class="card-content">
                    <div class="brand">${product.brand || 'Brand'}</div>
                    <div class="title" title="${product.title}">${product.title}</div>
                    <div class="price-container">
                        <span class="current-price">${displayPrice}</span>
                        ${oldPrice ? `<span class="old-price">${oldPrice}</span>` : ''}
                    </div>
                    <button class="details-btn">View Details</button>
                </div>
            `;

            // Click Event
            card.addEventListener('click', () => openModal(product));

            grid.appendChild(card);
        });
    }

    // Modal Logic
    function openModal(product) {
        const imageSrc = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400x500?text=No+Image';

        const displayPrice = product.discount_price || product.price || 'N/A';

        modalBody.innerHTML = `
            <div class="modal-images">
                <img src="${imageSrc}" alt="${product.title}" class="main-image">
            </div>
            <div class="modal-info">
                <div class="modal-brand">${product.brand || 'Brand'}</div>
                <h2 class="modal-title">${product.title}</h2>
                <div class="price-container" style="margin-bottom: 20px;">
                    <span class="current-price" style="font-size: 1.5rem;">${displayPrice}</span>
                </div>
                
                <div class="specs-grid">
                    <div class="spec-item">
                        <span class="label">Article / SKU</span>
                        <span class="value">${product.article || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="label">Composition</span>
                        <span class="value">${product.composition || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="label">Gender</span>
                        <span class="value">${product.gender || 'N/A'}</span>
                    </div>
                    ${product.sizes && product.sizes.length ? `
                    <div class="spec-item">
                        <span class="label">Available Sizes</span>
                        <span class="value">${product.sizes.join(', ')}</span>
                    </div>` : ''}
                </div>

                ${product.description && Object.keys(product.description).length > 0 ? `
                <div style="margin-bottom: 20px; color: #ccc; font-size: 0.9rem;">
                   ${Object.entries(product.description).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
                </div>
                ` : ''}

                <a href="${product.url}" target="_blank" class="buy-btn">
                    View on Official Store <i class="fa-solid fa-external-link-alt" style="margin-left: 5px;"></i>
                </a>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling bg
    }

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p =>
            (p.title && p.title.toLowerCase().includes(term)) ||
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            (p.article && p.article.toLowerCase().includes(term))
        );
        renderProducts(filtered);
    });
});

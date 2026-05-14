import { getProducts, getCart, updateCartQuantity, clearCart, formatZAR } from './main.js';

let products = [];

function loadProducts() {
    products = getProducts();
    renderGroupedProducts();
    loadCartTotal();
    setMinDate();
    attachGlobalListeners();
}

function renderGroupedProducts() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    const nonChandeliers = products.filter(p => 
        p.category !== "Chandeliers" && !p.category.toLowerCase().includes("chandelier")
    );
    container.innerHTML = `<h2 style="margin: 2rem 0 1rem;">Available Gear & Lighting</h2>`;
    if (nonChandeliers.length === 0) {
        container.innerHTML += `<div style="text-align:center; padding:3rem;">No rental items available. Visit <a href="chandelier.html">Chandelier Services</a>.</div>`;
        return;
    }
    const categoryMap = new Map();
    nonChandeliers.forEach(p => {
        if (!categoryMap.has(p.category)) categoryMap.set(p.category, []);
        categoryMap.get(p.category).push(p);
    });
    for (let [cat, catProducts] of categoryMap.entries()) {
        const catTitle = document.createElement('div');
        catTitle.className = 'category-title';
        catTitle.textContent = cat;
        container.appendChild(catTitle);
        const sliderDiv = document.createElement('div');
        sliderDiv.className = 'products-slider';
        const gridDiv = document.createElement('div');
        gridDiv.className = 'products-grid';
        catProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image}" style="width:100%; height:180px; object-fit:cover; border-radius:16px;">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatZAR(product.price)} <span>each</span></div>
                <div class="qty-control">
                    <label>Quantity:</label>
                    <input type="number" class="qty-input" data-id="${product.id}" value="0" min="0" max="${product.stock}">
                    <div class="stock-warning" data-id="${product.id}" style="color:#c0392b; font-size:0.7rem; display:none;">Max stock ${product.stock}</div>
                </div>
            `;
            // Out-of-stock / low stock warnings
            if (product.stock === 0) {
                const qtyDiv = card.querySelector('.qty-control');
                qtyDiv.innerHTML = '<span style="color:red; font-weight:bold;">❌ Out of Stock</span>';
            } else if (product.stock <= 3) {
                const priceDiv = card.querySelector('.product-price');
                const lowStockSpan = document.createElement('span');
                lowStockSpan.style.color = "orange";
                lowStockSpan.style.marginLeft = "0.5rem";
                lowStockSpan.textContent = `⚠️ Only ${product.stock} left!`;
                priceDiv.appendChild(lowStockSpan);
            }
            gridDiv.appendChild(card);
        });
        sliderDiv.appendChild(gridDiv);
        container.appendChild(sliderDiv);
    }
    // Quantity change event delegation
    container.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('qty-input')) {
            const input = e.target;
            const productId = input.getAttribute('data-id');
            const product = nonChandeliers.find(p => p.id === productId);
            if (!product) return;
            let desiredQty = parseInt(input.value) || 0;
            const warningDiv = input.parentElement.querySelector(`.stock-warning[data-id="${productId}"]`);
            if (desiredQty > product.stock) {
                if (warningDiv) warningDiv.style.display = "block";
                alert(`⚠️ Only ${product.stock} available.`);
                desiredQty = product.stock;
                input.value = desiredQty;
            } else {
                if (warningDiv) warningDiv.style.display = "none";
            }
            updateCartQuantity(productId, desiredQty);
            loadCartTotal();
        }
    });
}

function loadCartTotal() {
    const cart = getCart();
    let total = cart.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    const totalDisplay = document.getElementById('cartTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = formatZAR(total);
}

function setMinDate() {
    const dateInput = document.getElementById('eventDate');
    if (!dateInput) return;
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    const savedDate = localStorage.getItem("selectedDate");
    if (savedDate) dateInput.value = savedDate;
    dateInput.addEventListener('change', (e) => {
        localStorage.setItem("selectedDate", e.target.value);
    });
}

function attachGlobalListeners() {
    const proceedBtn = document.getElementById('proceedToDeliveryBtn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            const cart = getCart();
            if (cart.length === 0) {
                alert("Please add at least one item.");
                return;
            }
            const selectedDate = document.getElementById('eventDate')?.value;
            if (!selectedDate) {
                alert("Please select your event date.");
                return;
            }
            localStorage.setItem("selectedDate", selectedDate);
            window.location.href = "delivery.html";
        });
    }
    const resetBtn = document.getElementById('resetCartBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Clear cart?")) {
                clearCart();
                window.location.reload();
            }
        });
    }
}

window.onload = loadProducts;

import { getProducts, updateCartQuantity, getCart, clearCart, formatZAR } from './main.js';

let currentChandeliers = [];

function renderChandelierRows() {
    const products = getProducts();
    const container = document.getElementById('chandelierRowsContainer');
    if (!container) return;

    // Filter only chandeliers
    currentChandeliers = products.filter(p => 
        p.category === "Chandeliers" || 
        p.category.toLowerCase().includes("chandelier")
    );

    if (currentChandeliers.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:3rem; color:#666;">
            No chandelier services yet. Add them from the Admin Panel.
        </p>`;
        return;
    }

    // Split into groups of 6
    const groupSize = 6;
    const groups = [];
    for (let i = 0; i < currentChandeliers.length; i += groupSize) {
        groups.push(currentChandeliers.slice(i, i + groupSize));
    }

    container.innerHTML = '';
    
    groups.forEach((group, groupIndex) => {
        // Create a row wrapper with horizontal scroll
        const sliderDiv = document.createElement('div');
        sliderDiv.className = 'products-slider';
        sliderDiv.setAttribute('data-row', groupIndex);
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'products-grid';
        
        // Add each product card in this group
        group.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.image}" style="width:100%; height:180px; object-fit:cover; border-radius:16px;">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatZAR(product.price)}</div>
                <p style="margin:0.5rem 0; font-size:0.95rem; min-height:50px;">${product.desc}</p>
                
                <div class="qty-control" style="margin:1rem 0;">
                    <label>Quantity:</label>
                    <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock}" class="qty-input">
                </div>
                
                <button class="btn btn-primary request-service-btn" data-id="${product.id}">
                    Request Service
                </button>
            `;
            gridDiv.appendChild(card);
        });
        
        sliderDiv.appendChild(gridDiv);
        container.appendChild(sliderDiv);
    });

    // Attach event listeners to all "Request Service" buttons
    document.querySelectorAll('.request-service-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = btn.getAttribute('data-id');
            const qtyInput = document.getElementById(`qty-${productId}`);
            let qty = parseInt(qtyInput.value);
            if (isNaN(qty) || qty < 1) qty = 1;
            updateCartQuantity(productId, qty);
            alert("✅ Service request added to cart!");
            qtyInput.value = 1;
            updateCartTotal();
        });
    });
}

function updateCartTotal() {
    const cart = getCart();
    let total = cart.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    const totalDisplay = document.getElementById('cartTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = formatZAR(total);
}

function setupDatePicker() {
    const dateInput = document.getElementById('serviceDate');
    if (!dateInput) return;
    
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    const savedDate = localStorage.getItem("selectedDate");
    if (savedDate) {
        dateInput.value = savedDate;
    } else {
        dateInput.value = today;
        localStorage.setItem("selectedDate", today);
    }
    
    dateInput.addEventListener('change', (e) => {
        localStorage.setItem("selectedDate", e.target.value);
    });
}

function setupCartControls() {
    const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
    const resetBtn = document.getElementById('resetCartBtn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = getCart();
            if (cart.length === 0) {
                alert("Please add at least one service request.");
                return;
            }
            const selectedDate = document.getElementById('serviceDate').value;
            if (!selectedDate) {
                alert("Please select a service date.");
                return;
            }
            localStorage.setItem("selectedDate", selectedDate);
            window.location.href = "delivery.html";
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Clear all service requests from cart?")) {
                clearCart();
                updateCartTotal();
                alert("Cart cleared.");
            }
        });
    }
}

// Initial load
window.onload = () => {
    renderChandelierRows();
    updateCartTotal();
    setupDatePicker();
    setupCartControls();
};
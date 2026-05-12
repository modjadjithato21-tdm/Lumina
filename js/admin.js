import { getProducts, saveProducts, addProduct, deleteProduct, updateProduct, getBookings, formatZAR } from './main.js';

// ========== ADMIN PASSWORD PROTECTION ==========
const ADMIN_PASSWORD = "lumina2025";  // Change this to your own password

function checkAdminAuth() {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (isAuthenticated === "true") return true;
    
    const password = prompt("🔒 Admin Access Required:\nEnter password to continue:");
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("adminAuthenticated", "true");
        return true;
    } else {
        alert("Incorrect password. Access denied.");
        window.location.href = "index.html";
        return false;
    }
}
// ================================================

// Render products list (with edit/delete buttons)
function renderProducts() {
    const products = getProducts();
    const container = document.getElementById("productsList");
    if (!container) return;

    container.innerHTML = "";
    if (products.length === 0) {
        container.innerHTML = "<p>No products yet.</p>";
        return;
    }

    products.forEach(prod => {
        const card = document.createElement("div");
        card.className = "admin-product-card";
        card.innerHTML = `
            <img src="${prod.image || 'https://placehold.co/60'}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
            <div style="flex:1">
                <strong>${prod.name}</strong><br>
                <small>${prod.desc}</small><br>
                ${prod.category} | ${formatZAR(prod.price)} | Stock: ${prod.stock}
            </div>
            <div>
                <button class="edit-product-btn" data-id="${prod.id}">✏️</button>
                <button class="delete-product-btn" data-id="${prod.id}">🗑️</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Delete buttons
    document.querySelectorAll(".delete-product-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (confirm("Delete this item?")) {
                deleteProduct(btn.getAttribute("data-id"));
                renderProducts();
                renderOrders();
            }
        });
    });

    // Edit buttons
    document.querySelectorAll(".edit-product-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const product = getProducts().find(p => p.id === id);
            if (product) openEditModal(product);
        });
    });
}

// Render recent bookings (orders)
function renderOrders() {
    const bookings = getBookings();
    const container = document.getElementById("ordersList");
    if (!container) return;
    if (bookings.length === 0) {
        container.innerHTML = "<p>No bookings yet.</p>";
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="order-item">
            <strong>${b.id}</strong> – ${new Date(b.createdAt).toLocaleString()}<br>
            Total: ${formatZAR(b.grandTotal)}<br>
            Delivery: ${b.deliveryOption}<br>
            Event date: ${b.eventDate}
        </div>
    `).join('');
}

// Image upload preview
function setupImageUpload() {
    const upload = document.getElementById("prodImageUpload");
    const hiddenInput = document.getElementById("prodImage");
    const previewDiv = document.getElementById("imagePreview");

    if (!upload) return;
    upload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                hiddenInput.value = ev.target.result;
                if (previewDiv) previewDiv.innerHTML = `<img src="${ev.target.result}" style="max-width:100px; border-radius:8px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            if (previewDiv) previewDiv.innerHTML = "";
        }
    });
}

// Add new product or service
function addNewItem(isService = false) {
    const name = document.getElementById("prodName").value.trim();
    const desc = document.getElementById("prodDesc").value.trim();
    const price = parseFloat(document.getElementById("prodPrice").value);
    const stock = parseInt(document.getElementById("prodStock").value);
    const category = document.getElementById("prodCategory").value;
    let image = document.getElementById("prodImage").value.trim();

    if (!name || isNaN(price) || isNaN(stock)) {
        alert("Please fill all required fields correctly.");
        return;
    }
    if (!image) image = "https://placehold.co/400x300?text=" + encodeURIComponent(name);

    addProduct({
        id: Date.now().toString(),
        name,
        desc,
        price,
        stock,
        category,
        image
    });

    alert(isService ? "New Service Added!" : "New Product Added!");
    
    // Clear form
    document.getElementById("prodName").value = "";
    document.getElementById("prodDesc").value = "";
    document.getElementById("prodPrice").value = "";
    document.getElementById("prodStock").value = "";
    document.getElementById("prodImage").value = "";
    if (document.getElementById("prodImageUpload")) document.getElementById("prodImageUpload").value = "";
    if (document.getElementById("imagePreview")) document.getElementById("imagePreview").innerHTML = "";

    renderProducts();
}

// ---------- Edit Modal Logic ----------
const editModal = document.getElementById("editModal");
function openEditModal(product) {
    if (!editModal) return;
    document.getElementById("editProdId").value = product.id;
    document.getElementById("editName").value = product.name;
    document.getElementById("editDesc").value = product.desc;
    document.getElementById("editPrice").value = product.price;
    document.getElementById("editStock").value = product.stock;
    document.getElementById("editCategory").value = product.category;
    editModal.style.display = "block";
}

function closeEditModal() {
    if (editModal) editModal.style.display = "none";
}

function saveEdit() {
    const id = document.getElementById("editProdId").value;
    const name = document.getElementById("editName").value.trim();
    const desc = document.getElementById("editDesc").value.trim();
    const price = parseFloat(document.getElementById("editPrice").value);
    const stock = parseInt(document.getElementById("editStock").value);
    const category = document.getElementById("editCategory").value;

    if (!name || isNaN(price) || isNaN(stock)) {
        alert("Please fill all fields correctly.");
        return;
    }

    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex !== -1) {
        products[productIndex] = { ...products[productIndex], name, desc, price, stock, category };
        saveProducts(products);
        alert("Product updated!");
        closeEditModal();
        renderProducts();
    } else {
        alert("Product not found.");
    }
}

// ---------- Initialization with Password Lock ----------
window.addEventListener("DOMContentLoaded", () => {
    if (!checkAdminAuth()) return;

    // Setup edit modal event listeners
    if (editModal) {
        document.getElementById("saveEditBtn")?.addEventListener("click", saveEdit);
        document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);
        document.getElementById("closeEditModal")?.addEventListener("click", closeEditModal);
        window.addEventListener("click", (e) => { if (e.target === editModal) closeEditModal(); });
    }

    // Initial render
    renderProducts();
    renderOrders();
    setupImageUpload();

    // Add product/service buttons
    document.getElementById("addProductBtn")?.addEventListener("click", () => addNewItem(false));
    document.getElementById("addServiceBtn")?.addEventListener("click", () => addNewItem(true));
});
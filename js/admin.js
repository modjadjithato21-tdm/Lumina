import { getProducts, saveProducts, addProduct, deleteProduct, getBookings, formatZAR } from './main.js';

// ========== ADMIN PASSWORD PROTECTION (NO SESSION – PROMPT EVERY TIME) ==========
const ADMIN_PASSWORD = "lumina2025";

function checkAdminAuth() {
    const password = prompt("🔒 Admin Access Required:\nEnter password to continue:");
    if (password === ADMIN_PASSWORD) {
        return true;
    } else {
        alert("Incorrect password. Access denied.");
        window.location.href = "index.html";
        return false;
    }
}
// ================================================

// ========== RENDER PRODUCTS (with edit/delete) ==========
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

// ========== RENDER ORDERS WITH STATUS & EXPORT ==========
function renderOrders() {
    const bookings = getBookings();
    const container = document.getElementById("ordersList");
    if (!container) return;
    if (bookings.length === 0) {
        container.innerHTML = "<p>No bookings yet.</p>";
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div class="order-item" data-id="${b.id}">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap;">
                <strong>${b.id}</strong> – ${new Date(b.createdAt).toLocaleString()}
                <select class="order-status-select" data-id="${b.id}">
                    <option ${b.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option ${b.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
                    <option ${b.status === "Completed" ? "selected" : ""}>Completed</option>
                    <option ${b.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                </select>
            </div>
            <div>Total: ${formatZAR(b.grandTotal)} | Delivery: ${b.deliveryOption}</div>
            <div>Event: ${b.eventDate} | Email: ${b.customerEmail || "—"}</div>
            <div>Address: ${b.address}</div>
            <button class="save-status-btn" data-id="${b.id}" style="margin-top:0.5rem;">Save Status</button>
        </div>
    `).join('');
    // Save status listeners
    document.querySelectorAll(".save-status-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const select = document.querySelector(`.order-status-select[data-id="${id}"]`);
            const newStatus = select.value;
            const bookings = getBookings();
            const order = bookings.find(b => b.id === id);
            if (order) {
                order.status = newStatus;
                localStorage.setItem("eventBookings", JSON.stringify(bookings));
                alert(`Status updated to ${newStatus}`);
                renderOrders(); // refresh
            }
        });
    });
}

// ========== EXPORT CSV ==========
function exportOrdersToCSV() {
    const bookings = getBookings();
    if (!bookings.length) {
        alert("No orders to export.");
        return;
    }
    const rows = bookings.map(b => ({
        ID: b.id,
        Date: new Date(b.createdAt).toLocaleString(),
        EventDate: b.eventDate,
        CustomerEmail: b.customerEmail || "—",
        Delivery: b.deliveryOption,
        Address: b.address,
        Total: b.grandTotal,
        Status: b.status || "Pending"
    }));
    const csvContent = "data:text/csv;charset=utf-8," 
        + Object.keys(rows[0]).join(",") + "\n"
        + rows.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "lumina_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========== IMAGE UPLOAD PREVIEW (for add form) ==========
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

// ========== ADD NEW PRODUCT / SERVICE ==========
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
    document.getElementById("prodImageUpload").value = "";
    if (document.getElementById("imagePreview")) document.getElementById("imagePreview").innerHTML = "";
    renderProducts();
}

// ========== EDIT MODAL (with image upload) ==========
const editModal = document.getElementById("editModal");
function openEditModal(product) {
    if (!editModal) return;
    document.getElementById("editProdId").value = product.id;
    document.getElementById("editName").value = product.name;
    document.getElementById("editDesc").value = product.desc;
    document.getElementById("editPrice").value = product.price;
    document.getElementById("editStock").value = product.stock;
    document.getElementById("editCategory").value = product.category;
    document.getElementById("editImageData").value = product.image || "";
    const previewDiv = document.getElementById("editImagePreview");
    if (previewDiv) previewDiv.innerHTML = product.image ? `<img src="${product.image}" style="max-width:100px;">` : "";
    // image upload listener
    const upload = document.getElementById("editImageUpload");
    upload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById("editImageData").value = ev.target.result;
                previewDiv.innerHTML = `<img src="${ev.target.result}" style="max-width:100px;">`;
            };
            reader.readAsDataURL(file);
        }
    };
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
    const image = document.getElementById("editImageData").value.trim() || "https://placehold.co/400x300";
    if (!name || isNaN(price) || isNaN(stock)) {
        alert("Please fill all fields correctly.");
        return;
    }
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        products[idx] = { ...products[idx], name, desc, price, stock, category, image };
        saveProducts(products);
        alert("Product updated!");
        closeEditModal();
        renderProducts();
    } else {
        alert("Product not found.");
    }
}

// ========== LOGOUT FUNCTION ==========
function logoutAdmin() {
    // No session to clear – simply redirect to home
    window.location.href = "index.html";
}

// ========== INITIALIZATION WITH LOCK ==========
window.addEventListener("DOMContentLoaded", () => {
    if (!checkAdminAuth()) return;  // prompts for password on every load
    // Setup edit modal listeners
    document.getElementById("saveEditBtn")?.addEventListener("click", saveEdit);
    document.getElementById("cancelEditBtn")?.addEventListener("click", closeEditModal);
    document.getElementById("closeEditModal")?.addEventListener("click", closeEditModal);
    window.addEventListener("click", (e) => { if (e.target === editModal) closeEditModal(); });
    // Export button
    document.getElementById("exportOrdersBtn")?.addEventListener("click", exportOrdersToCSV);
    // Logout button (optional – add in admin.html)
    const logoutBtn = document.getElementById("logoutAdminBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logoutAdmin);
    // Initial renders
    renderProducts();
    renderOrders();
    setupImageUpload();
    // Add buttons
    document.getElementById("addProductBtn")?.addEventListener("click", () => addNewItem(false));
    document.getElementById("addServiceBtn")?.addEventListener("click", () => addNewItem(true));
});

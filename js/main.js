export function formatZAR(amount) {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount);
}

const DEFAULT_PRODUCTS = [
    { id: "p1", name: "Bluetooth Speaker 300W", desc: "Powerful 300W Bluetooth speakers", price: 250, stock: 10, image: "https://placehold.co/400x300?text=Speakers", category: "Speakers" },
    { id: "p2", name: "Premium Tent 3x3m", desc: "3x3m marquee tent with side walls", price: 800, stock: 5, image: "https://placehold.co/400x300?text=Tents", category: "Tents" },
    { id: "p3", name: "Table + 4 Chairs Set", desc: "1 folding table + 4 plastic chairs", price: 400, stock: 8, image: "https://placehold.co/400x300?text=Tables+Chairs", category: "Tables & Chairs" },
    { id: "ch1", name: "Crystal Chandelier", desc: "Elegant 12-light crystal chandelier", price: 1500, stock: 3, image: "https://placehold.co/400x300?text=Crystal+Chandelier", category: "Chandeliers" }
];

export function getProducts() {
    const stored = localStorage.getItem("eventProducts");
    if (!stored) {
        localStorage.setItem("eventProducts", JSON.stringify(DEFAULT_PRODUCTS));
        return [...DEFAULT_PRODUCTS];
    }
    return JSON.parse(stored);
}
export function saveProducts(products) { localStorage.setItem("eventProducts", JSON.stringify(products)); }
export function addProduct(product) { const p = getProducts(); p.push(product); saveProducts(p); }
export function deleteProduct(id) { let p = getProducts(); p = p.filter(pr => pr.id !== id); saveProducts(p); }
export function updateProduct(prod) { let p = getProducts(); const idx = p.findIndex(pr => pr.id === prod.id); if(idx!==-1) p[idx]=prod; saveProducts(p); }

export function getCart() { const c = localStorage.getItem("eventRentalCart"); return c ? JSON.parse(c) : []; }
export function saveCart(cart) { localStorage.setItem("eventRentalCart", JSON.stringify(cart)); }

export function removeFromCart(pid) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== pid);
    saveCart(cart);
}

export function updateCartQuantity(pid, newQty) {
    const products = getProducts();
    const prod = products.find(p => p.id === pid);
    if (!prod) return false;
    if (newQty < 0) newQty = 0;
    if (newQty > prod.stock) return false;
    
    let cart = getCart();
    const idx = cart.findIndex(i => i.id === pid);
    if (idx !== -1) {
        if (newQty === 0) {
            cart.splice(idx, 1);
        } else {
            cart[idx].quantity = newQty;
            cart[idx].itemTotal = newQty * prod.price;
        }
    } else if (newQty > 0) {
        cart.push({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            quantity: newQty,
            itemTotal: newQty * prod.price,
            image: prod.image,
            category: prod.category
        });
    }
    saveCart(cart);
    return true;
}

export function clearCart() { localStorage.removeItem("eventRentalCart"); }

export function getBookings() { const b = localStorage.getItem("eventBookings"); return b ? JSON.parse(b) : []; }
export function saveBooking(booking) {
    const b = getBookings();
    b.push({...booking, id:"ORD"+Date.now(), createdAt:new Date().toISOString()});
    localStorage.setItem("eventBookings", JSON.stringify(b));
}
export function reduceStockFromCart(cart) {
    let products = getProducts();
    cart.forEach(cItem => {
        const p = products.find(pr => pr.id === cItem.id);
        if(p) { p.stock -= cItem.quantity; if(p.stock<0) p.stock=0; }
    });
    saveProducts(products);
}
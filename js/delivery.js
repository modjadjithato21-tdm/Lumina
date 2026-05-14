import { getCart, clearCart, formatZAR } from './main.js';

let currentCart = [];
let currentSubtotal = 0;

function loadCart() {
    currentCart = getCart();
    const container = document.getElementById('cart-items');
    if (currentCart.length === 0) {
        container.innerHTML = `<p class="warning-msg">No items. <a href="index.html">Go back</a></p>`;
        return;
    }
    let html = '';
    currentSubtotal = 0;
    currentCart.forEach(item => {
        const itemTotal = item.itemTotal || (item.price * item.quantity);
        currentSubtotal += itemTotal;
        html += `
            <div class="summary-item">
                <div>
                    <img src="${item.image || 'https://placehold.co/50'}" style="width:50px;height:50px;border-radius:8px;">
                    <strong>${item.name}</strong><br>
                    <small>Qty: ${item.quantity}</small>
                </div>
                <div style="text-align:right;">${formatZAR(itemTotal)}</div>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById('summary-subtotal').textContent = `Items Subtotal: ${formatZAR(currentSubtotal)}`;
    updateFinalTotal();
}

function updateFinalTotal() {
    const isDelivery = document.getElementById('del-yes').checked;
    const fee = isDelivery ? 250 : 0;
    document.getElementById('delivery-fee').textContent = `Delivery Fee: ${formatZAR(fee)}`;
    document.getElementById('final-total').textContent = formatZAR(currentSubtotal + fee);
}

async function getCurrentLocation() {
    const btn = document.getElementById('getLocationBtn');
    btn.textContent = "Getting location...";
    btn.disabled = true;
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        btn.textContent = "📍 Auto Get My Location";
        btn.disabled = false;
        return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const coords = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        document.getElementById('coordinates').value = coords;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const data = await response.json();
            if (data && data.display_name) {
                document.getElementById('address').value = data.display_name;
                alert("✅ Location & Address captured!");
            } else {
                alert("Coordinates saved.");
            }
        } catch (error) {
            console.error(error);
            alert("Coordinates saved.");
        }
        btn.textContent = "📍 Auto Get My Location";
        btn.disabled = false;
    }, (error) => {
        alert("Unable to get location.");
        btn.textContent = "📍 Auto Get My Location";
        btn.disabled = false;
    });
}

function proceedToConfirm() {
    const isDelivery = document.getElementById('del-yes').checked;
    const address = document.getElementById('address').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const addressError = document.getElementById('addressError');
    
    if (!customerEmail) {
        alert("Please enter your email address.");
        return;
    }
    if (isDelivery && address === "") {
        addressError.style.display = "block";
        return;
    } else {
        addressError.style.display = "none";
    }
    const deliveryFee = isDelivery ? 250 : 0;
    const finalTotal = currentSubtotal + deliveryFee;
    const orderData = {
        items: currentCart,
        deliveryOption: isDelivery ? "Delivery" : "Pickup",
        deliveryFee: deliveryFee,
        grandTotal: finalTotal,
        depositAmount: Math.round(finalTotal * 0.3),
        address: address,
        coordinates: document.getElementById('coordinates').value.trim(),
        date: localStorage.getItem("selectedDate") || "Not set",
        customerEmail: customerEmail
    };
    localStorage.setItem("tempDelivery", JSON.stringify(orderData));
    window.location.href = "confirm.html";
}

window.onload = function() {
    loadCart();
    document.querySelectorAll('input[name="delivery"]').forEach(r => {
        r.addEventListener('change', updateFinalTotal);
    });
    document.getElementById('placeOrderBtn').addEventListener('click', proceedToConfirm);
    document.getElementById('getLocationBtn').addEventListener('click', getCurrentLocation);
};

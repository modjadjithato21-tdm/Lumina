import { getCart, saveBooking, reduceStockFromCart, clearCart, formatZAR } from './main.js';

let orderData = {};

// Helper to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Order ID copied to clipboard!");
    }).catch(() => {
        alert("Failed to copy. Please copy manually.");
    });
}

function loadOrder() {
    const cart = getCart();
    if (cart.length === 0) { window.location.href = "index.html"; return; }
    const temp = localStorage.getItem("tempDelivery");
    if (!temp) { window.location.href = "delivery.html"; return; }
    orderData = JSON.parse(temp);
    orderData.items = cart;
    orderData.date = localStorage.getItem("selectedDate") || "Not set";
    renderSummary();
}

function renderSummary() {
    const container = document.getElementById("orderSummaryBlock");
    let itemsHtml = `<h3>Your items</h3><ul>`;
    orderData.items.forEach(i => {
        itemsHtml += `<li style="display:flex; gap:0.5rem; align-items:center;">
            <img src="${i.image || 'https://placehold.co/40'}" style="width:30px;height:30px;border-radius:6px;"> 
            ${i.name} x ${i.quantity} = ${formatZAR(i.price * i.quantity)}
        </li>`;
    });
    itemsHtml += `</ul><p>📅 Event date: ${orderData.date}</p>`;
    itemsHtml += `<p>🚚 Delivery: ${orderData.deliveryOption} – ${formatZAR(orderData.deliveryFee)}</p>`;
    itemsHtml += `<p>📍 Delivery address: <strong>${orderData.address || "Not provided"}</strong></p>`;
    itemsHtml += `<p>📌 Coordinates: ${orderData.coordinates || "Not provided"}</p>`;
    itemsHtml += `<p>📧 Your email: ${orderData.customerEmail || "Not provided"}</p>`;
    itemsHtml += `<p>🛡️ Deposit (30%): ${formatZAR(orderData.depositAmount)}</p>`;
    itemsHtml += `<h2>💵 Grand total: ${formatZAR(orderData.grandTotal)}</h2>`;
    container.innerHTML = itemsHtml;
}

function getWhatsAppNumber() {
    const hasChandelier = orderData.items.some(item => 
        item.category === "Chandeliers" || item.name.toLowerCase().includes("chandelier")
    );
    return hasChandelier ? "0795391530" : "0848350556";
}

function shareWhatsApp() {
    let msg = `🎉 *New Booking Request* 🎉\n\n`;
    msg += `*Items:*\n`;
    orderData.items.forEach(i => { 
        msg += `• ${i.name}: ${i.quantity} x ${formatZAR(i.price)} = ${formatZAR(i.price * i.quantity)}\n`; 
    });
    msg += `\n📅 *Date:* ${orderData.date}`;
    msg += `\n🚚 *Delivery:* ${orderData.deliveryOption} (${formatZAR(orderData.deliveryFee)})`;
    msg += `\n📍 *Address:* ${orderData.address || "Not provided"}`;
    msg += `\n📌 *Coordinates:* ${orderData.coordinates || "Not provided"}`;
    msg += `\n🛡️ *Deposit:* ${formatZAR(orderData.depositAmount)}`;
    msg += `\n💰 *Total:* ${formatZAR(orderData.grandTotal)}`;
    msg += `\n📧 *Email:* ${orderData.customerEmail || "Not provided"}`;
    msg += `\n\n_We will contact you within 24h._`;
    const url = `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// EmailJS is commented out – enable later if needed
async function sendOrderEmail() {
    // Email sending is disabled for now
    console.log("Email sending skipped – booking saved locally.");
}

async function finalConfirm() {
    const orderId = "ORD" + Date.now();
    const booking = {
        items: orderData.items,
        deliveryOption: orderData.deliveryOption,
        deliveryFee: orderData.deliveryFee,
        depositAmount: orderData.depositAmount,
        grandTotal: orderData.grandTotal,
        eventDate: orderData.date,
        address: orderData.address || "Not provided",
        coordinates: orderData.coordinates || "Not provided",
        customerEmail: orderData.customerEmail || "Not provided",
        id: orderId,
        createdAt: new Date().toISOString(),
        status: "Pending"
    };
    saveBooking(booking);
    reduceStockFromCart(orderData.items);
    clearCart();
    localStorage.removeItem("tempDelivery");
    localStorage.removeItem("selectedDate");
    
    // Optional: send email (uncomment if needed)
    // await sendOrderEmail();
    
    const msgDiv = document.getElementById("confirmMsg");
    msgDiv.style.display = "block";
    msgDiv.innerHTML = `
        ✅ <strong>Booking request submitted!</strong><br><br>
        <strong style="font-size:1.2rem;">Your Order ID: ${orderId}</strong><br>
        <button id="copyOrderIdBtn" class="btn btn-outline" style="margin:0.5rem 0; padding:0.3rem 1rem;">📋 Copy Order ID</button><br>
        <em>Please save this ID to track your order.</em><br><br>
        We will contact you at <strong>${orderData.customerEmail || "your email"}</strong> within 24 hours.<br><br>
        📞 WhatsApp us:<br>
        🛍️ Rent Gear: <a href="https://wa.me/27848350556">084 835 0556</a><br>
        💎 Chandelier: <a href="https://wa.me/27795391530">079 539 1530</a><br><br>
        <a href="track.html?id=${orderId}" class="btn btn-primary" style="text-decoration:none;">🔍 Track this Order</a>
    `;
    msgDiv.style.backgroundColor = "#e0f2e9";
    msgDiv.style.borderLeft = "4px solid #2e7d32";
    
    // Attach copy event after rendering
    const copyBtn = document.getElementById("copyOrderIdBtn");
    if (copyBtn) copyBtn.onclick = () => copyToClipboard(orderId);
    
    // Redirect after 8 seconds (give time to copy)
    setTimeout(() => { window.location.href = "orders.html"; }, 8000);
}

document.getElementById("requestBookingBtn")?.addEventListener("click", () => {
    if (confirm("Submit this booking request? You will be contacted for payment within 24h.")) {
        finalConfirm();
    }
});
document.getElementById("whatsappBtn")?.addEventListener("click", shareWhatsApp);

loadOrder();

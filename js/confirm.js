import { getCart, saveBooking, reduceStockFromCart, clearCart, formatZAR } from './main.js';

let orderData = {};

// ========== EMAILJS CONFIGURATION ==========
const EMAILJS_PUBLIC_KEY = "k0zULqG8DbDVDF8rJ";
const EMAILJS_SERVICE_ID = "service_qrpyajh";
const EMAILJS_TEMPLATE_ID = "template_jg8gx5d";
// ============================================

emailjs.init(EMAILJS_PUBLIC_KEY);

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
    msg += `\n\n_We will contact you within 24h._`;
    const url = `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

async function sendOrderEmail() {
    const customerName = orderData.address.split(',')[0] || "Customer";
    const itemsForEmail = orderData.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: formatZAR(i.price * i.quantity)
    }));

    const templateParams = {
        to_email: "modjadjithato21@gmail.com",
        order_id: "ORD" + Date.now(),
        customer_name: customerName,
        customer_email: "customer@example.com",  // Optional – you can add an email field later
        event_date: orderData.date,
        delivery_option: orderData.deliveryOption,
        delivery_fee: formatZAR(orderData.deliveryFee),
        delivery_address: orderData.address || "Not provided",
        coordinates: orderData.coordinates || "Not provided",
        items: itemsForEmail,
        deposit: formatZAR(orderData.depositAmount),
        total: formatZAR(orderData.grandTotal)
    };

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        console.log("Order email sent to admin");
    } catch (error) {
        console.error("Email send failed:", error);
    }
}

async function finalConfirm() {
    const booking = {
        items: orderData.items,
        deliveryOption: orderData.deliveryOption,
        deliveryFee: orderData.deliveryFee,
        depositAmount: orderData.depositAmount,
        grandTotal: orderData.grandTotal,
        eventDate: orderData.date,
        address: orderData.address || "Not provided",
        coordinates: orderData.coordinates || "Not provided"
    };
    saveBooking(booking);
    reduceStockFromCart(orderData.items);
    clearCart();
    localStorage.removeItem("tempDelivery");
    localStorage.removeItem("selectedDate");
    
    await sendOrderEmail();
    
    const msgDiv = document.getElementById("confirmMsg");
    msgDiv.style.display = "block";
    msgDiv.innerHTML = `
        ✅ <strong>Booking request submitted!</strong><br><br>
        We will contact you within 24 hours to confirm payment and final details.<br><br>
        📞 You can also WhatsApp us at:<br>
        🛍️ Rent Gear: <a href="https://wa.me/27848350556">084 835 0556</a><br>
        💎 Chandelier: <a href="https://wa.me/27795391530">079 539 1530</a><br><br>
        📧 A confirmation email has been sent to our team.
    `;
    msgDiv.style.backgroundColor = "#e0f2e9";
    msgDiv.style.borderLeft = "4px solid #2e7d32";
    
    setTimeout(() => { window.location.href = "orders.html"; }, 5000);
}

document.getElementById("requestBookingBtn")?.addEventListener("click", () => {
    if (confirm("Submit this booking request? You will be contacted for payment within 24h.")) {
        finalConfirm();
    }
});
document.getElementById("whatsappBtn")?.addEventListener("click", shareWhatsApp);

loadOrder();
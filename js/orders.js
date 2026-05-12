import { getBookings, formatZAR } from './main.js';

function renderUserOrders() {
    const bookings = getBookings();
    const container = document.getElementById("ordersListContainer");
    
    if (bookings.length === 0) {
        container.innerHTML = "<p>You have no orders yet. <a href='index.html'>Start shopping</a></p>";
        return;
    }
    
    // Show most recent first
    const sorted = [...bookings].reverse();
    
    container.innerHTML = sorted.map(b => `
        <div class="order-item" style="margin-bottom:1rem; padding:1rem;">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap;">
                <strong>Order #${b.id}</strong>
                <span>${new Date(b.createdAt).toLocaleDateString()}</span>
            </div>
            <div><strong>Status:</strong> ✅ Confirmed (Paid)</div>
            <div><strong>Total:</strong> ${formatZAR(b.grandTotal)}</div>
            <div><strong>Delivery:</strong> ${b.deliveryOption}</div>
            <div><strong>Event Date:</strong> ${b.eventDate}</div>
            <details>
                <summary>Items</summary>
                <ul>
                    ${b.items.map(item => `<li>${item.name} x ${item.quantity} = ${formatZAR(item.price * item.quantity)}</li>`).join('')}
                </ul>
            </details>
            <div><strong>Address:</strong> ${b.address}</div>
        </div>
    `).join('');
}

window.onload = renderUserOrders;
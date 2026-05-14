import { getBookings, formatZAR } from './main.js';

document.getElementById('trackBtn').addEventListener('click', () => {
    const orderId = document.getElementById('orderIdInput').value.trim();
    const bookings = getBookings();
    const order = bookings.find(b => b.id === orderId);
    const resultDiv = document.getElementById('trackResult');
    if (!order) {
        resultDiv.innerHTML = `<div class="warning-msg">❌ Order not found. Please check the ID.</div>`;
        return;
    }
    resultDiv.innerHTML = `
        <div class="order-item">
            <h3>Order ${order.id}</h3>
            <p><strong>Status:</strong> <span style="color:${order.status === 'Confirmed' ? 'green' : order.status === 'Pending' ? 'orange' : 'gray'}">${order.status || 'Pending'}</span></p>
            <p><strong>Event Date:</strong> ${order.eventDate}</p>
            <p><strong>Total:</strong> ${formatZAR(order.grandTotal)}</p>
            <p><strong>Delivery:</strong> ${order.deliveryOption}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            <p><strong>Email:</strong> ${order.customerEmail || '—'}</p>
            <p><strong>Items:</strong></p>
            <ul>${order.items.map(i => `<li>${i.name} x ${i.quantity}</li>`).join('')}</ul>
            ${order.status === 'Pending' ? '<p>⏳ We will contact you soon.</p>' : '<p>✅ Order confirmed. Thank you!</p>'}
        </div>
    `;
});
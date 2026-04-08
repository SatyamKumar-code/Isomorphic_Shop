const fs = require('fs');

const orders = [];
const statuses = ["pending", "shipped", "delivered", "cancelled"];
const paymentMethods = ["Razorpay", "COD"];
const paymentStatuses = ["pending", "completed", "failed"];

for (let i = 1; i <= 50; i++) {
    orders.push({
        userId: { "$oid": "69c2be4617ff300cbc86583a" }, // Replace with real User ID
        products: [
            { 
                productId: { "$oid": "69d3c990dbaa6e5e5a5816a9" + (i % 9) }, 
                quantity: Math.floor(Math.random() * 5) + 1 
            }
        ],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        paymentId: Math.random() > 0.5 ? "pay_ID" + Math.random().toString(36).substring(7) : null,
        delivery_address: { "$oid": "65f1a2b3c4d5e6f7a8b9c0e" + (i % 9) },
        totalAmount: Math.floor(Math.random() * 5000) + 100,
        createdAt: { "$date": new Date().toISOString() },
        updatedAt: { "$date": new Date().toISOString() }
    });
}

fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
console.log("50 Orders generated in orders.json");
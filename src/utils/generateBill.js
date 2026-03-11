export const generateBill = (order) => {
  const subtotal = order.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  const deliveryFee = 0;
  const tax = subtotal * 0; // 5% tax
  const total = subtotal + deliveryFee + tax;
  
  const billNumber = `BILL-${order.id}-${Date.now()}`;
  
  return {
    billNumber,
    orderId: order.id,
    date: new Date().toLocaleString(),
    customerName: order.customer?.name || 'Customer',
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    })),
    subtotal,
    deliveryFee,
    tax,
    total,
    paymentMethod: order.paymentMethod || 'Cash',
    gstin: '07AABCT1332L1Z5',
    placeOfSupply: order.customer?.address || 'Campus'
  };
};

export const formatBillForPrint = (bill) => {
  return `
    <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Campus Food Delivery</h2>
          <p>Tax Invoice/Bill of Supply</p>
        </div>
        
        <div class="details">
          <p><strong>Bill No:</strong> ${bill.billNumber}</p>
          <p><strong>Date:</strong> ${bill.date}</p>
          <p><strong>Order ID:</strong> ${bill.orderId}</p>
          <p><strong>Customer:</strong> ${bill.customerName}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <p>Subtotal: ₹${bill.subtotal}</p>
          <p>Delivery Fee: ₹${bill.deliveryFee}</p>
          <p>Tax (5%): ₹${bill.tax.toFixed(2)}</p>
          <p>Total: ₹${bill.total.toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for ordering with Campus Food!</p>
          <p>GSTIN: ${bill.gstin}</p>
        </div>
      </body>
    </html>
  `;
};
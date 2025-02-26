import nodemailer from 'nodemailer';

// Configure email transport for general email notifications
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

export async function sendOrderConfirmation(email: string, orderDetails: any) {
  try {
    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_USER || 'noreply@restaurant.com',
        name: 'Restaurant Management'
      },
      subject: 'Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order!</h2>
          <p style="color: #666;">Your order has been received and is being prepared.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333;">Order Details</h3>
            <p>Order ID: ${orderDetails.id}</p>
            <p>Total Amount: $${orderDetails.total}</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(msg);
    return { success: true, message: "Order confirmation sent" };
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    return { success: false, message: "Failed to send order confirmation" };
  }
}
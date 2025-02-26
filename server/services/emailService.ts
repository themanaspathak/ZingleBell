import nodemailer from 'nodemailer';

// Configure email transport for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: process.env.GMAIL_EMAIL,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666;">You have requested to reset your password. Click the link below to set a new password:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          <p style="color: #666;">This link will expire in 1 hour.</p>
        </div>
      `
    };

    await transporter.sendMail(msg);
    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, message: "Failed to send password reset email" };
  }
}

export async function sendOrderConfirmation(email: string, orderDetails: any) {
  try {
    const msg = {
      to: email,
      from: process.env.GMAIL_EMAIL,
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
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map<string, { otp: string; expires: Date }>();

export async function sendOTP(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📤 Attempting to send OTP to ${email}`);

    // Store OTP with 5-minute expiration
    otpStore.set(email, {
      otp,
      expires: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Test SendGrid configuration
    console.log('🔍 Verifying SendGrid configuration...');
    if (!process.env.SENDGRID_API_KEY?.startsWith('SG.')) {
      throw new Error('Invalid SendGrid API key format');
    }

    // Prepare email message
    const msg = {
      to: email,
      from: {
        email: 'themanaspathak@gmail.com',
        name: 'Restaurant Management'
      },
      subject: 'Your OTP for Restaurant Order',
      text: `Your OTP is: ${otp}`, // Plain text version
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your One-Time Password</h2>
          <p style="color: #666; font-size: 16px;">Use the following OTP to verify your email address:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    console.log('📧 Sending email via SendGrid:', {
      to: msg.to,
      from: msg.from.email,
      subject: msg.subject,
      timestamp: new Date().toISOString()
    });

    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully', {
      statusCode: response[0]?.statusCode,
      headers: response[0]?.headers,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: "OTP sent successfully",
    };
  } catch (error: any) {
    console.error("❌ Failed to send OTP:", {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        response: error.response?.body,
        timestamp: new Date().toISOString()
      }
    });

    let errorMessage = "Failed to send OTP";
    if (error.code === 401) {
      errorMessage = "SendGrid authentication failed. Please check the API key.";
    } else if (error.code === 403) {
      errorMessage = "SendGrid authorization failed. Please verify sender verification status.";
    } else if (error.message.includes('Invalid SendGrid API key format')) {
      errorMessage = "Invalid SendGrid API key format. Please check your API key.";
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export function verifyOTP(email: string, otp: string): {
  success: boolean;
  message: string;
} {
  const storedData = otpStore.get(email);

  if (!storedData) {
    return {
      success: false,
      message: "No OTP found. Please request a new OTP.",
    };
  }

  const { otp: storedOtp, expires } = storedData;

  // Check if OTP is expired
  if (expires < new Date()) {
    otpStore.delete(email);
    return {
      success: false,
      message: "OTP has expired. Please request a new OTP.",
    };
  }

  // Verify OTP
  const isValid = storedOtp === otp;

  // Clear OTP after verification (whether successful or not)
  otpStore.delete(email);

  return {
    success: isValid,
    message: isValid ? "OTP verified successfully" : "Invalid OTP. Please try again.",
  };
}
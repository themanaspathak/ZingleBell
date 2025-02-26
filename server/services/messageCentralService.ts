import request from 'request';

// Store verification IDs temporarily (in production, use Redis or similar)
const verificationStore = new Map<string, { verificationId: string; expires: Date }>();

// Mock OTP for development
const MOCK_OTP = '123456';

export async function sendOTP(mobileNumber: string): Promise<{
  success: boolean;
  message: string;
}> {
  // If no auth token is present, use mock implementation
  if (!process.env.MESSAGE_CENTRAL_AUTH_TOKEN) {
    console.log('⚠️ Running in development mode - using mock OTP service');
    console.log(`📱 Mock OTP ${MOCK_OTP} for ${mobileNumber}`);

    // Store mock verification data
    verificationStore.set(mobileNumber, {
      verificationId: 'mock-verification-id',
      expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    });

    return {
      success: true,
      message: "Development mode: Mock OTP sent successfully"
    };
  }

  try {
    console.log(`📤 Attempting to send OTP to ${mobileNumber}`);

    const options = {
      method: 'POST',
      url: `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=C-0BD79595E45C4DB&flowType=SMS&mobileNumber=${mobileNumber}`,
      headers: {
        'authToken': process.env.MESSAGE_CENTRAL_AUTH_TOKEN
      }
    };

    return new Promise((resolve, reject) => {
      request(options, function (error, response) {
        if (error) {
          console.error("❌ Failed to send OTP:", {
            error: {
              message: error.message,
              name: error.name,
              timestamp: new Date().toISOString()
            }
          });
          reject({
            success: false,
            message: "Failed to send OTP. Please try again."
          });
        }

        try {
          const responseData = JSON.parse(response.body);
          console.log('✅ SMS sent successfully', {
            statusCode: response.statusCode,
            body: response.body,
            timestamp: new Date().toISOString()
          });

          verificationStore.set(mobileNumber, {
            verificationId: responseData.data.verificationId,
            expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
          });

          resolve({
            success: true,
            message: "OTP sent successfully"
          });
        } catch (parseError) {
          console.error("❌ Failed to parse response:", parseError);
          reject({
            success: false,
            message: "Failed to process OTP request."
          });
        }
      });
    });
  } catch (error: any) {
    console.error("❌ Failed to send OTP:", {
      error: {
        message: error.message,
        name: error.name,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: false,
      message: "Failed to send OTP. Please try again.",
    };
  }
}

export async function verifyOTP(mobileNumber: string, otp: string): Promise<{
  success: boolean;
  message: string;
}> {
  // If no auth token is present, use mock implementation
  if (!process.env.MESSAGE_CENTRAL_AUTH_TOKEN) {
    console.log('⚠️ Running in development mode - using mock OTP verification');

    const storedData = verificationStore.get(mobileNumber);
    if (!storedData) {
      return {
        success: false,
        message: "Verification session expired. Please request a new OTP.",
      };
    }

    const isValid = otp === MOCK_OTP;
    verificationStore.delete(mobileNumber); // Clear verification data after attempt

    return {
      success: isValid,
      message: isValid ? "OTP verified successfully" : "Invalid OTP. Please try again.",
    };
  }

  try {
    console.log(`🔍 Verifying OTP for ${mobileNumber}`, { 
      receivedOtp: otp,
      storedData: verificationStore.get(mobileNumber)
    });

    const storedData = verificationStore.get(mobileNumber);

    if (!storedData) {
      console.log("❌ No verification ID found for", mobileNumber);
      return {
        success: false,
        message: "Verification session expired. Please request a new OTP.",
      };
    }

    const { verificationId, expires } = storedData;

    // Check if verification session is expired
    if (expires < new Date()) {
      console.log("❌ Verification session expired for", mobileNumber);
      verificationStore.delete(mobileNumber);
      return {
        success: false,
        message: "Verification session expired. Please request a new OTP.",
      };
    }

    const options = {
      method: 'GET',
      url: `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=C-0BD79595E45C4DB&code=${otp}`,
      headers: {
        'authToken': process.env.MESSAGE_CENTRAL_AUTH_TOKEN
      }
    };

    return new Promise((resolve) => {
      request(options, function (error, response) {
        if (error) {
          console.error("❌ Verification request failed:", error);
          return resolve({
            success: false,
            message: "Failed to verify OTP. Please try again."
          });
        }

        try {
          const responseData = JSON.parse(response.body);
          console.log("Verification API Response:", responseData);
          const isValid = responseData.responseCode === "200" || responseData.responseCode === 200;

          console.log(`${isValid ? '✅' : '❌'} OTP verification ${isValid ? 'successful' : 'failed'}`, {
            verificationId,
            receivedOtp: otp,
            mobileNumber,
            response: responseData
          });

          // Clear verification data after attempt
          verificationStore.delete(mobileNumber);

          return resolve({
            success: isValid,
            message: isValid ? "OTP verified successfully" : "Invalid OTP. Please try again.",
          });
        } catch (parseError) {
          console.error("❌ Failed to parse verification response:", parseError);
          return resolve({
            success: false,
            message: "Failed to verify OTP. Please try again."
          });
        }
      });
    });
  } catch (error) {
    console.error("❌ Verification error:", error);
    return {
      success: false,
      message: "Failed to verify OTP. Please try again."
    };
  }
}
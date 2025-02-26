import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { apiRequest } from "@/lib/queryClient";
import { Phone, MessageCircle, ChevronLeft, Send } from "lucide-react";

export default function MobileVerification() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { state, dispatch } = useCart();
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/send-mobile-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send OTP");
      }

      toast({
        title: "OTP Sent",
        description: `Please check your mobile (+91 ${formatPhoneNumber(mobileNumber)}) for OTP`,
      });
      setShowOtpInput(true);
      setResendTimer(30); // Start 30-second countdown
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async () => {
    try {
      const guestEmail = `${mobileNumber}@guest.restaurant.com`;
      console.log("Creating guest order with email:", guestEmail);

      const orderData = {
        tableNumber: state.tableNumber || 1,
        userEmail: guestEmail,
        mobileNumber: mobileNumber,
        customerName: customerName,
        items: state.items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          customizations: item.customizations || {}
        })),
        status: "in progress",
        paymentStatus: "pending" as const,
        paymentMethod: "cash" as const,
        cookingInstructions: state.cookingInstructions || "",
        total: state.items.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        ),
      };

      console.log("Attempting to place order with data:", orderData);

      const response = await apiRequest("/api/orders", "POST", orderData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      dispatch({ type: "CLEAR_CART" });

      // Store mobile number and customer name in localStorage
      localStorage.setItem("verifiedMobile", mobileNumber);
      localStorage.setItem("customerName", customerName);

      navigate("/order-confirmed");
    } catch (error: any) {
      console.error("Failed to place order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 4-digit OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/verify-mobile-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Invalid OTP");
      }

      toast({
        title: "Mobile Verified",
        description: "Proceeding to place your order",
      });

      await placeOrder();
    } catch (error: any) {
      console.error("Verification failed:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      setOtp(""); // Clear the OTP input on failure
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 5) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return digits;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full">
            <Phone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verify Your Number</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {!showOtpInput
              ? "We'll send you a one-time password to verify your number"
              : "Enter the verification code we sent you"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {!showOtpInput ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-12 pl-10 text-lg bg-muted/50 border-2 border-muted-foreground/20 rounded-xl shadow-sm transition-all duration-200 focus:border-primary/50 focus:bg-background hover:bg-muted/70"
                      disabled={isLoading}
                    />
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      +91
                    </span>
                    <Input
                      type="tel"
                      placeholder="Mobile Number"
                      value={formatPhoneNumber(mobileNumber)}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-12 pl-12 text-lg tracking-wide bg-muted/50 border-2 border-muted-foreground/20 rounded-xl shadow-sm transition-all duration-200 focus:border-primary/50 focus:bg-background hover:bg-muted/70"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              <Button
                className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-xl"
                onClick={handleSendOtp}
                disabled={mobileNumber.length !== 10 || !customerName.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send OTP
                  </span>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full space-y-2">
                    <Input
                      type="text"
                      maxLength={4}
                      className="text-center text-3xl tracking-[1em] h-16 font-mono bg-muted/50 border-2 border-muted-foreground/20 rounded-xl shadow-sm transition-all duration-200 focus:border-primary/50 focus:bg-background hover:bg-muted/70"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 4) {
                          setOtp(value);
                        }
                      }}
                      placeholder="••••"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 4-digit code sent to<br />
                    <span className="font-medium text-foreground">+91 {formatPhoneNumber(mobileNumber)}</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <Button
                    className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-xl"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 4 || isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-2 hover:bg-muted/50 transition-all duration-200 rounded-xl"
                      onClick={() => {
                        setShowOtpInput(false);
                        setOtp("");
                        setCustomerName("");
                        setMobileNumber("");
                      }}
                      disabled={isLoading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Change Details
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-2 hover:bg-muted/50 transition-all duration-200 rounded-xl"
                      onClick={handleSendOtp}
                      disabled={isLoading || resendTimer > 0}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
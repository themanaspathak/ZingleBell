import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { Mail } from "lucide-react";

export default function EmailVerification() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResending(true);
      const response = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      toast({
        title: "OTP Sent",
        description: `Please check your email (${email}) for OTP`,
      });
      setShowOtpInput(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error("Invalid OTP");
      }

      // Store verified email in localStorage
      localStorage.setItem("verifiedEmail", email);

      toast({
        title: "Email Verified",
        description: "Proceeding to order confirmation",
      });
      navigate("/order-confirmed");
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Verify Email Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showOtpInput ? (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-base"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  We'll send you a one-time password (OTP)
                </p>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSendOtp}
                disabled={!validateEmail(email)}
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-center text-sm text-gray-500">
                  Enter the 6-digit code sent to {email}
                </p>

                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter OTP"
                  className="text-center text-xl py-6 bg-muted/50 border-2 border-muted-foreground/20 rounded-xl shadow-sm transition-all duration-200 focus:border-primary/50 focus:bg-background hover:bg-muted/70"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                />

                <div className="pt-4 space-y-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6}
                  >
                    Verify OTP
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">
                      Didn't receive the OTP?
                    </p>
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-primary/90"
                      onClick={handleSendOtp}
                      disabled={isResending}
                    >
                      {isResending ? "Sending..." : "Resend OTP"}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                  >
                    Change Email
                  </Button>
                </div>

              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
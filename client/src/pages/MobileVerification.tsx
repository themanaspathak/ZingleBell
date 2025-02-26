import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send } from "lucide-react";

export default function MobileVerification() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { state, dispatch } = useCart();
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const placeOrder = async () => {
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

      const orderData = {
        tableNumber: state.tableNumber || 1,
        mobileNumber: mobileNumber,
        customerName: customerName,
        items: state.items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          customizations: item.customizations || {}
        })),
        status: "in progress",
        cookingInstructions: state.cookingInstructions || "",
        total: state.items.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        ),
      };

      const response = await apiRequest("/api/orders", "POST", orderData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      dispatch({ type: "CLEAR_CART" });

      // Store order flag and mobile number in localStorage
      localStorage.setItem("hasPlacedOrder", "true");
      localStorage.setItem("currentMobileNumber", mobileNumber);

      navigate("/order-confirmed");
    } catch (error: any) {
      console.error("Failed to place order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Order</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Please provide your details to place the order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
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
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-12 pl-12 text-lg tracking-wide bg-muted/50 border-2 border-muted-foreground/20 rounded-xl shadow-sm transition-all duration-200 focus:border-primary/50 focus:bg-background hover:bg-muted/70"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <Button
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-xl"
            onClick={placeOrder}
            disabled={mobileNumber.length !== 10 || !customerName.trim() || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                Placing Order...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Place Order
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}